using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Infrastructure.Algorithms;
using AlgorithmTester.Infrastructure.Reports;

namespace AlgorithmTester.Application;

public class WebSocketHandler
{
    public static async Task Echo(WebSocket webSocket)
    {
    //Zapelnienie bufora wiadomością
        var reportGenerator = new ReportGenerator();
        
        // Per-connection state
        Task? algorithmTask = null;
        CancellationTokenSource? cts = null;
        var pauseEvent = new ManualResetEventSlim(true);
        
        bool algorithmStateLoaded = false;
        string? requestType = null;
        IRequest? currentState = null;
        AlgorithmCommand? currentCommand = null;
        //Obsługa websocketa
        while(webSocket.State == WebSocketState.Open)
        {
            var buffer = new byte[4096];
            var result = await webSocket.ReceiveAsync(buffer, CancellationToken.None);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
            }
            
            if (result.MessageType == WebSocketMessageType.Text) {
                //Otrzymujemy tekst i serializujemy go na websocketmessage
                var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                try
                {
                    var wsMessage = JsonSerializer.Deserialize<WebSocketMessage>(json);
                    //WALIDACJA
                    if (wsMessage.Request.ValueKind != JsonValueKind.Undefined && wsMessage.Command.ValueKind != JsonValueKind.Undefined)
                    {
                        throw new InvalidDataException("Cannot send command and request together");
                    }
                    if (wsMessage.Request.ValueKind == JsonValueKind.Undefined && wsMessage.Command.ValueKind == JsonValueKind.Undefined)
                    {
                        throw new InvalidDataException("Request or command not found");
                    }
                    //LOAD ALGORITHM REQUEST TO STATE
                    if (wsMessage.Request.ValueKind != JsonValueKind.Undefined)
                    {                       
                        // Check if a previous algorithm task is still running
                        if (algorithmTask != null && !algorithmTask.IsCompleted)
                        {
                            throw new InvalidDataException("Algorithm/s already started");
                        }
                        if (wsMessage.Request.ValueKind == JsonValueKind.Null) throw new InvalidDataException("Request is empty");

                        var request = JsonSerializer.Deserialize<Request>(wsMessage.Request);
                        switch (request.Type)
                        {
                            case "Algorithm":
                                currentState = JsonSerializer.Deserialize<AlgorithmRequest>(request.Body);
                                requestType = "Algorithm";
                                break;
                            case "Function":
                                currentState = JsonSerializer.Deserialize<FunctionRequest>(request.Body);
                                requestType = "Function";
                                break;
                        }
                        if (!currentState.isValidated()) { throw new Exception("Error validating request"); }
                        algorithmStateLoaded = true;
                    }


                    //SEND COMMAND
                    if (wsMessage.Command.ValueKind != JsonValueKind.Undefined)
                    {
                        if (currentState == null) throw new InvalidDataException("Current state is null");
                        currentCommand = JsonSerializer.Deserialize<AlgorithmCommand>(wsMessage.Command);

                        switch (currentCommand.RequestedState.ToLower())
                        {
                            case "start":
                                {
                                    if (algorithmTask != null && !algorithmTask.IsCompleted) throw new InvalidDataException("Algorithm already is started");
                                    if (requestType == null) throw new InvalidDataException("No request found");
                                    cts = new CancellationTokenSource();
                                    pauseEvent.Set();
                                    
                                    Console.WriteLine("[START] Setting up log callback and starting algorithm...");
                                    
                                    // Set up log callback to send logs to client
                                    AlgorithmHandler.SetLogCallback(async (message) =>
                                    {
                                        try
                                        {
                                            Console.WriteLine($"[LOG] {message}");
                                            var logMessage = JsonSerializer.Serialize(new
                                            {
                                                type = "log",
                                                message = message
                                            });
                                            await SendMessage(webSocket, logMessage);
                                        }
                                        catch (Exception ex)
                                        {
                                            Console.WriteLine($"[LOG ERROR] Failed to send log: {ex.Message}");
                                        }
                                    });
                                    
                                    AlgorithmHandler.SetProgressCallback(async (progressValue) =>
                                    {
                                        try {
                                            var progressMsg = JsonSerializer.Serialize(new { progress = progressValue });
                                            await SendMessage(webSocket, progressMsg);
                                        }
                                        catch
                                        {
                                            
                                        }
                                    });

                                    algorithmTask = Task.Run(async () =>
                                    {
                                        try
                                        {
                                            Console.WriteLine("[ALGORITHM] Running algorithm...");
                                            await AlgorithmHandler.RunAlgorithmAsync(currentState,requestType,reportGenerator, pauseEvent, cts.Token);
                                            Console.WriteLine("[ALGORITHM] Completed, sending done message");
                                        }
                                        catch(Exception ex)
                                        {
                                            Console.WriteLine($"[ALGORITHM ERROR] {ex.Message}");
                                            await SendError(webSocket, ex.Message);
                                        }
                                        finally
                                        {
                                            await SendMessage(webSocket, reportGenerator.ConvertReportToJSON());
                                            Console.WriteLine("[ALGORITHM] Sending final report");
                                            await SendMessage(webSocket, "done");
                                            cts.Dispose();
                                            cts = null;
                                            algorithmTask = null;
                                        }
                                    });
                                    break;
                                }
                            case "stop":
                                {
                                    if (algorithmTask == null || algorithmTask.IsCompleted) throw new InvalidDataException("Algorithm/s is not running");
                                    if(cts == null) throw new Exception("No cancellation token");

                                    cts.Cancel();
                                    pauseEvent.Set();
                                    try
                                    {
                                        if (algorithmTask != null)
                                        {
                                            await algorithmTask;
                                        }              
                                    }
                                    catch(OperationCanceledException)
                                    {
                                        await SendMessage(webSocket,reportGenerator.ConvertReportToJSON());
                                    }
                                    catch(Exception ex)
                                    {
                                        await SendError(webSocket, $"Error while stopping: {ex.Message}");
                                    }
                                    finally
                                    {
                                        cts.Dispose();
                                        cts = null;
                                        algorithmTask = null;
                                    }
                                    break;
                                }
                            case "pause":
                                if (algorithmTask == null || algorithmTask.IsCompleted) throw new InvalidDataException("Algorithm not running");
                                pauseEvent.Reset();
                                await SendMessage(webSocket, JsonSerializer.Serialize(new { status = "Paused" }));
                                break;

                            case "resume":
                                if (algorithmTask == null || algorithmTask.IsCompleted) throw new InvalidDataException("Algorithm not running");
                                pauseEvent.Set();
                                await SendMessage(webSocket, JsonSerializer.Serialize(new { status = "Resumed" }));
                                break;
                            default:
                                {
                                    throw new InvalidDataException("Wrong command");
                                }
                        }
                    }
                }
                catch(Exception ex)
                {
                    await SendError(webSocket, ex.Message);
                }
                
            }
        }
        
        // Cleanup when connection closes
        Console.WriteLine("[WebSocket] Connection closed, cleaning up state");
        if (algorithmTask != null && !algorithmTask.IsCompleted)
        {
            try { cts?.Cancel(); } catch {}
        }
        algorithmTask = null;
        if (cts != null)
        {
            cts.Dispose();
            cts = null;
        }
    }
    private static Task SendError(WebSocket webSocket, string message)
    {
        var json = JsonSerializer.Serialize(new
        {
            type = "error",
            error = message
        });
        var bytes = Encoding.UTF8.GetBytes(json);
        return webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
    }

    private static void HandleRequest(JsonElement request, AlgorithmRequest algorithmrequest)
    {
        if (request.ValueKind == JsonValueKind.Null) throw new InvalidDataException("Request is empty");
        algorithmrequest = JsonSerializer.Deserialize<AlgorithmRequest>(request);
    } 
    private static async Task SendMessage(WebSocket webSocket, string message)
    {
        var bytes = Encoding.UTF8.GetBytes(message);
        if(webSocket.State == WebSocketState.Open)
        {
            await webSocket.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
        }
    }
}