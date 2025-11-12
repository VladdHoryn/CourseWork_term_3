using System.Text;
using CourseWork.Controllers.AuthController;
using CourseWork.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
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
builder.Services.AddScoped<RegistrationRequestService>();
builder.Services.AddSingleton<TokenService>();

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
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// ========================
// Routing
// ========================

// Важливо: Для атрибутних маршрутів
app.MapControllers();

// Якщо у тебе є Razor Pages (наприклад, /Account/Login)
app.MapRazorPages();

// Базовий маршрут для MVC Views
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
