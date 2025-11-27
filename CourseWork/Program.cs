using System.Text;
using CourseWork;
using CourseWork.Controllers.AuthController;
using CourseWork.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;
using Сoursework.Services;

var builder = WebApplication.CreateBuilder(args);

// ========================
// MVC + Razor
// ========================
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// ========================
// MongoDB
// ========================
var mongoDbSettings = builder.Configuration.GetSection("MongoDbSettings");
var connectionString = mongoDbSettings["ConnectionString"] 
                       ?? throw new InvalidOperationException("MongoDB ConnectionString not found.");
var dbName = mongoDbSettings["DatabaseName"] 
             ?? throw new InvalidOperationException("MongoDB DatabaseName not found.");

builder.Services.AddSingleton(new MongoDBRepository(connectionString, dbName));


// Create MongoDB client and get the database
var client = new MongoClient(connectionString); // Use connectionString from config
var database = client.GetDatabase(dbName);      // Use dbName from config

// database.DropCollection("users");
// database.DropCollection("visits");
// database.DropCollection("payments");
// database.DropCollection("registration_requests");

// Seed the database with initial data if collections are empty
DatabaseSeeder.SeedDatabase(database, new PasswordHasher<User>());

// ========================
// Repositories
// ========================
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<VisitRepository>();
builder.Services.AddScoped<PaymentRepository>();
builder.Services.AddScoped<PatientRepository>();
builder.Services.AddScoped<SpecialistRepository>();
builder.Services.AddScoped<OperatorRepository>();
builder.Services.AddScoped<AdministratorRepository>();
builder.Services.AddScoped<RegistrationRequestRepository>();

// ========================
// Services
// ========================
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<VisitService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<PatientService>();
builder.Services.AddScoped<SpecialistService>();
builder.Services.AddScoped<OperatorService>();
builder.Services.AddScoped<AdministratorService>();
builder.Services.AddScoped<GuestService>();
builder.Services.AddScoped<RegistrationRequestService>();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<LoggingService>();

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// ========================
// JWT Authentication
// ========================
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SuperSecretKey123");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };
    });

// ========================
// Authorization Policies
// ========================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RequireOperator", policy => policy.RequireRole("Administrator", "Operator"));
    options.AddPolicy("RequireSpecialist", policy => policy.RequireRole("Administrator", "Specialist"));
    options.AddPolicy("RequirePatient", policy => policy.RequireRole("Patient"));
});

// ========================
// Build App
// ========================
var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// ✅ Це забезпечить доступ до файлів у wwwroot (включно з guest.html)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// ========================
// Custom Route — відкриття guest.html при запуску
// ========================
app.MapGet("/", async context =>
{
    context.Response.Redirect("/guest.html");
});

// ========================
// Routing для Controllers і Razor Pages
// ========================
app.MapControllers();
app.MapRazorPages();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
