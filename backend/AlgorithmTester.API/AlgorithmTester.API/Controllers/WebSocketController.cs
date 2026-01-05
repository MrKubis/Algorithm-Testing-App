using System.Net;
using System.Security.Cryptography;
using AlgorithmTester.Application.Algorithm;
using Microsoft.AspNetCore.Mvc;

namespace AlgorithmTester.API.Controllers;

[ApiController]
[Route("/ws")]
public class WebSocketController : ControllerBase
{
    [HttpGet]
    public async Task Get()
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await WebSocketHandler.Echo(webSocket);
        }
        else
        {
            HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
}