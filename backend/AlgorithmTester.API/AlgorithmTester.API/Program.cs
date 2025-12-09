using System.Text.Json;
using AlgorithmTester.API;
using Microsoft.AspNetCore.WebSockets;


var builder = WebApplication.CreateBuilder(args);



// Add services to the container.
builder.Services.AddControllers();

var app = builder.Build();
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseWebSockets();

var webSocketOptions = new WebSocketOptions()
{
    KeepAliveInterval = TimeSpan.FromSeconds(120),
};
app.UseWebSockets(webSocketOptions);
app.MapControllers();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.Run();
