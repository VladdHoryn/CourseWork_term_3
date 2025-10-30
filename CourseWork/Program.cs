using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Сoursework.Models;
using Сoursework.Repositories;
using Сoursework.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

// 1. Configure MongoDB
var mongoDbSettings = builder.Configuration.GetSection("MongoDbSettings");
var connectionString = mongoDbSettings["ConnectionString"] ?? throw new InvalidOperationException("MongoDB ConnectionString not found.");
var dbName = mongoDbSettings["DatabaseName"] ?? throw new InvalidOperationException("MongoDB DatabaseName not found.");

builder.Services.AddSingleton(new MongoDBRepository(connectionString, dbName));

// 2. Repositories
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<VisitRepository>();
builder.Services.AddScoped<PaymentRepository>();

// 3. Services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<VisitService>();
builder.Services.AddScoped<PaymentService>();

// 4. JWT Authentication
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "SuperSecretKey123"); // fallback for dev

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// 5. Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RequireOperator", policy => policy.RequireRole("Administrator", "Operator"));
    options.AddPolicy("RequireSpecialist", policy => policy.RequireRole("Administrator", "Specialist"));
    options.AddPolicy("RequirePatient", policy => policy.RequireRole("Patient"));
});

builder.Services.AddRazorPages();

var app = builder.Build();

// Middleware pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// 🔐 Must be in this order:
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapRazorPages();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
