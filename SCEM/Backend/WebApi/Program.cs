using Core.Contracts;

using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Keycloak.AuthServices.Common;

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

using Persistence;

using System;
using System.Collections.Generic;
using System.IO;

using Base.Web;

using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

Environment.SetEnvironmentVariable("DOTNET_hostBuilder:reloadConfigOnChange", "false");
var builder = WebApplication.CreateBuilder(args);

var host          = builder.Host;
var configuration = builder.Configuration;
var services      = builder.Services;

services.AddCors();
services.AddControllers();

services.AddKeycloakWebApiAuthentication(builder.Configuration);

services
    .AddAuthorization()
    .AddKeycloakAuthorization(configuration)
    .AddAuthorizationBuilder()
    .AddPolicy("AdminUser", builder =>
    {
        var keycloakOptions = configuration.GetKeycloakOptions<KeycloakAuthenticationOptions>()!;

        builder
            //            .RequireRealmRoles("Admin")                                                // Realm role is fetched from token
            //            .RequireResourceRolesForClient(keycloakOptions.Resource, ["myAdminRole"]) // Require Resource Roles (for this Client)
            .RequireResourceRoles("myAdminRole"); // Resource/Client role is fetched from token (any client)
        ;
    })
    .AddPolicy("NormalUser", builder =>
    {
        var keycloakOptions = configuration.GetKeycloakOptions<KeycloakAuthenticationOptions>()!;
        builder
//            .RequireRealmRoles("User")                                                // Realm role is fetched from token
//            .RequireResourceRolesForClient(keycloakOptions.Resource, ["myUserRole"]) // Require Resource Roles (for this Client)
            .RequireResourceRoles("myUserRole"); // Resource/Client role is fetched from token (any client)
        ;
    })
    ;

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
services.AddEndpointsApiExplorer();
services.AddSwaggerGen(c =>
{
    var keycloakOptions = configuration.GetKeycloakOptions<KeycloakAuthenticationOptions>()!;

    c.AddSecurityDefinition(
        "oidc",
        new OpenApiSecurityScheme
        {
            Name             = "oauth2",
            Type             = SecuritySchemeType.OpenIdConnect,
            OpenIdConnectUrl = new Uri(keycloakOptions.OpenIdConnectUrl!)
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id   = "oidc"
                    }
                },
                Array.Empty<string>()
            }
        }
    );

    c.SwaggerDoc("v1", new OpenApiInfo { Title = "DemoSyp", Version = "v1" });

    var xmlFile = "WebApi.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var sqLiteBuilder = new SqliteConnectionStringBuilder(connectionString);
sqLiteBuilder.DataSource = Path.GetFullPath(
    Path.Combine(
        AppDomain.CurrentDomain.GetData(
            "DataDirectory") as string ?? AppDomain.CurrentDomain.BaseDirectory,
        sqLiteBuilder.DataSource
    ));
connectionString = sqLiteBuilder.ToString();

builder.Services
    .AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString))
    .AddScoped<IUnitOfWork, UnitOfWork>()
    .AddTransient<IMDemoRepository, MDemoRepository>()
    .AddTransient<IImportService, ImportService>()
    ;

var app = builder.Build();
app.MapControllers();


// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
{
    app.UseSwagger(options =>
    {
        options.PreSerializeFilters.Add((doc, request) =>
        {
            if (request.Host.Value!.Contains(".cloud.htl-leonding.ac.at"))
            {
                // leocloud is using path based routing for different apps on the same domain => XXX.cloud.htl-leonding.ac.at/demosypapi
                // nginx is forwarding the requests to our application but removes the path part "/demosypapi"
                // we have to adjust the server url in swagger documentation accordingly

                // we use hostname to find the correct server url => hostname is in the format e.g. "demosypapi-79686ccb6c-6g26k"
                var fullhostname = System.Net.Dns.GetHostEntry("").HostName;
                var hostname     = fullhostname.Split('-')[0];

                doc.Servers = new List<OpenApiServer>
                {
                    new OpenApiServer { Url = $"{request.Scheme}s://{request.Host.Value}/{hostname}" } 
                };
            }
        });
    });
    app.UseSwaggerUI(options => { options.OAuthClientId("myTestAPI"); });
}

// Add CORS to support Single Page Apps (SPAs)
app.UseCors(b => b.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();