using System.Text.Json;

namespace AlgorithmTester.Domain.Requests;

public class WebSocketMessage
{
    public string MessageType { get; set;  }
    public JsonElement Request { get; set; }
    public JsonElement Command { get; set; }
}