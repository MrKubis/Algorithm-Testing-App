using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AlgorithmTester.Domain.Requests;

public class WebSocketMessage
{
    public string MessageType { get; set;  }
    public JsonElement Request { get; set; }
    public JsonElement Command { get; set; }
}

//Pózniej dać do enuma
public enum MessageType
{
    REQUEST, COMMAND
}
