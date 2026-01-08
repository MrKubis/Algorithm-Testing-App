using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using AlgorithmTester.Domain.Requests;
using AlgorithmTester.Domain.Validators;
using AlgorithmTester.Infrastructure.Algorithms;
using AlgorithmTester.Infrastructure.Reports;

namespace AlgorithmTester.Application;

public class WebSocketHandler
{
    private static Task? _algorithmTask;
    private static CancellationTokenSource? _cts;
    private static ReportGenerator _reportGenerator;
    public static async Task Echo(WebSocket webSocket)
    {
    //Zapelnienie bufora wiadomością
        _reportGenerator = new ReportGenerator();
        bool algorithmStateLoaded = false;
        AlgorithmRequest? currentState = null;
        AlgorithmCommand? currentCommand = null;
        bool isRunning = false;
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
                        if (isRunning) throw new InvalidDataException("Algorithm already is started");
                        if (wsMessage.Request.ValueKind == JsonValueKind.Null) throw new InvalidDataException("Request is empty");
                        currentState = JsonSerializer.Deserialize<AlgorithmRequest>(wsMessage.Request);
                        //Validate request
                        if (AlgorithmRequestValidator.Validate(currentState)) algorithmStateLoaded = true;
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
                                    if (isRunning) throw new InvalidDataException("Algorithm already is started");
                                    _cts = new CancellationTokenSource();
                                    _algorithmTask = Task.Run(async () =>
                                    {
                                        try
                                        {
                                            await AlgorithmHandler.RunAlgorithmAsync(currentState,_reportGenerator, _cts.Token);
                                            await SendMessage(webSocket, "done");
                                        }
                                        catch(Exception ex)
                                        {
                                            await SendError(webSocket, ex.Message);
                                        }
                                        finally
                                        {
                                            isRunning = false;
                                            await SendMessage(webSocket, _reportGenerator.ConvertReportToJSON());
                                        }
                                    });
                                    
                                    isRunning = true;
                                    break;
                                }
                            case "stop":
                                {
                                    if (!isRunning) throw new InvalidDataException("Algorithm is not running");
                                    if(_cts == null) throw new Exception("No cancellation token");

                                    _cts.Cancel();
                                    try
                                    {
                                        if (_algorithmTask != null)
                                        {
                                            await _algorithmTask;
                                        }              
                                        //TUTAJ BĘDZIE RAPORTOWANIE
                                    }
                                    catch(OperationCanceledException)
                                    {
                                        await SendMessage(webSocket,_reportGenerator.ConvertReportToJSON());
                                    }
                                    catch(Exception ex)
                                    {
                                        await SendError(webSocket, $"Error while stopping: {ex.Message}");
                                    }
                                    finally
                                    {
                                        _cts.Dispose();
                                        _cts = null;
                                        _algorithmTask = null;

                                        isRunning = false;
                                    }
                                    break;
                                }
                            default:
                                {
                                    throw new InvalidDataException("Wrong command");
                                }
                        }
                    }
                }
                catch(Exception ex)
                {
                    SendError(webSocket, ex.Message);
                }
                
            }
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