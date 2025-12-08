using System.Net.WebSockets;

namespace AlgorithmTester.Application.Algorithm;

public class WebSocketHandler
{
    public static async Task Echo(WebSocket webSocket)
    {
        //Zapelnienie bufora wiadomością
        var buffer = new byte[1024 * 4];
        var receiveResult = await webSocket.ReceiveAsync(
            new ArraySegment<byte>(buffer), CancellationToken.None);
        
        //Wysyłanie wiadomości z bufora
        while (!receiveResult.CloseStatus.HasValue)
        {
            await webSocket.SendAsync(
                new ArraySegment<byte>(buffer, 0, receiveResult.Count),
                receiveResult.MessageType,
                receiveResult.EndOfMessage,
                CancellationToken.None);
            receiveResult = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(buffer), CancellationToken.None);
        }
        
        //Zamknięcie wiadomości
        await webSocket.CloseAsync(
                receiveResult.CloseStatus.Value,
                receiveResult.CloseStatusDescription,
                CancellationToken.None);
    }
}