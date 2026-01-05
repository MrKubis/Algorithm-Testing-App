using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using AlgorithmTester.Domain.requests;
using AlgorithmTester.Infrastructure.Algorithms;

namespace AlgorithmTester.Application.Algorithm;

public class WebSocketHandler
{
    public static async Task Echo(WebSocket webSocket)
    {
        Console.WriteLine($"[WS] Connection Hit. Socket State: {webSocket.State}");

        try
        {
            using var socketLock = new SemaphoreSlim(1, 1);
            
            CancellationTokenSource? cts = null;
            Task? algorithmTask = null;
            AlgorithmRequest? currentState = null;
            bool isRunning = false;
            var buffer = new byte[1024 * 4];

            async Task SafeSendAsync(string message)
            {
                if (webSocket.State != WebSocketState.Open) return;
                try
                {
                    await socketLock.WaitAsync();
                    if (webSocket.State == WebSocketState.Open)
                    {
                        var bytes = Encoding.UTF8.GetBytes(message);
                        await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
                    }
                }
                finally { socketLock.Release(); }
            }

            async Task SafeSendError(string errorMsg)
            {
                Console.WriteLine($"[WS Error] {errorMsg}");
                var json = JsonSerializer.Serialize(new { type = "error", error = errorMsg });
                await SafeSendAsync(json);
            }

            try 
            {
                Console.WriteLine("[WS] Fetching Algorithms...");
                var availableAlgorithms = AlgorithmDiscoveryService.GetAllAlgorithmsMetadata();
                
                var jsonOptions = new JsonSerializerOptions
                {
                    NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowNamedFloatingPointLiterals,
                    WriteIndented = true
                };

                var initMessage = JsonSerializer.Serialize(new
                {
                    type = "INIT_ALGORITHMS",
                    payload = availableAlgorithms
                }, jsonOptions);

                await SafeSendAsync(initMessage);
                Console.WriteLine("[WS] Init Data Sent.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WS CRASH] Init Failed: {ex.Message}");
                await SafeSendError($"Initialization Failed: {ex.Message}");
                return;
            }

            while (webSocket.State == WebSocketState.Open)
            {
                using var ms = new MemoryStream();
                WebSocketReceiveResult result;
                do
                {
                    result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                    ms.Write(buffer, 0, result.Count);
                } while (!result.EndOfMessage);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                    break;
                }

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    ms.Seek(0, SeekOrigin.Begin);
                    using var reader = new StreamReader(ms, Encoding.UTF8);
                    var json = await reader.ReadToEndAsync();
                    
                    try
                    {
                        var wsMessage = JsonSerializer.Deserialize<WebSocketMessage>(json);
                        if (wsMessage == null) continue;

                        if (wsMessage.Request.ValueKind != JsonValueKind.Undefined)
                        {
                            currentState = JsonSerializer.Deserialize<AlgorithmRequest>(wsMessage.Request);
                        }

                        if (wsMessage.Command.ValueKind != JsonValueKind.Undefined)
                        {
                            var cmd = JsonSerializer.Deserialize<AlgorithmCommand>(wsMessage.Command);
                            if (cmd?.RequestedState.ToLower() == "start")
                            {
                                if (isRunning) { await SafeSendError("Already running"); continue; }
                                if (currentState == null) { await SafeSendError("No state loaded"); continue; }

                                cts = new CancellationTokenSource();
                                var token = cts.Token;
                                isRunning = true;
                                
                                algorithmTask = Task.Run(async () =>
                                {
                                    try
                                    {
                                        await AlgorithmHandler.RunAlgorithmAsync(currentState, async (msg) => await SafeSendAsync(msg), token);
                                    }
                                    catch (Exception ex) 
                                    { 
                                        await SafeSendError($"Algo Error: {ex.Message}"); 
                                    }
                                    finally
                                    {
                                        isRunning = false;
                                        Console.WriteLine("[WS] Algorithm finished or stopped. Ready for next run.");
                                    }
                                }, token);
                            }
                            else if (cmd?.RequestedState.ToLower() == "stop")
                            {
                                cts?.Cancel();
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        await SafeSendError($"Processing Error: {ex.Message}");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WS FATAL] Handler crashed: {ex.ToString()}");
        }
    }
}