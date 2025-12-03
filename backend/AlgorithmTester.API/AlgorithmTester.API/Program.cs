using System.Text.Json;
using AlgorithmTester.API;
using Fleck;


var builder = WebApplication.CreateBuilder(args);


//Websocket

var wsConnections = new List<IWebSocketConnection>();

var server = new WebSocketServer("ws://0.0.0.0:8181");
server.Start(ws =>
{
    ws.OnOpen = () =>
    {
        wsConnections.Add(ws);
    };

    ws.OnMessage = message =>
    {
        var obj = JsonSerializer.Deserialize<AlgorithmRequest>(message);

        foreach(var param in obj.ParamInfoList)
        {
            Console.WriteLine(param.Name);
        }
    };

});

// Add services to the container.
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
