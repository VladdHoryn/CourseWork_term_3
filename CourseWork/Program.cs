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

// Add Controllers + Views
builder.Services.AddControllers();
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// 1. Configure MongoDB
var mongoDbSettings = builder.Configuration.GetSection("MongoDbSettings");
var connectionString = mongoDbSettings["ConnectionString"] ?? throw new InvalidOperationException("MongoDB ConnectionString not found.");
var dbName = mongoDbSettings["DatabaseName"] ?? throw new InvalidOperationException("MongoDB DatabaseName not found.");

builder.Services.AddSingleton(new MongoDBRepository(connectionString, dbName));

// 2. Repositories
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<VisitRepository>();
builder.Services.AddScoped<PaymentRepository>();
builder.Services.AddScoped<PatientRepository>();
builder.Services.AddScoped<SpecialistRepository>();
builder.Services.AddScoped<OperatorRepository>();
builder.Services.AddScoped<AdministratorRepository>();
builder.Services.AddScoped<RegistrationRequestRepository>();

// 3. Services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<VisitService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<PatientService>();
builder.Services.AddScoped<SpecialistService>();
// builder.Services.AddScoped<OperatorService>();
// builder.Services.AddScoped<AdministratorService>();
builder.Services.AddScoped<RegistrationRequestService>();
builder.Services.AddSingleton<TokenService>();

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
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// 5. Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RequireOperator", policy => policy.RequireRole("Administrator", "Operator"));
    options.AddPolicy("RequireSpecialist", policy => policy.RequireRole("Administrator", "Specialist"));
    options.AddPolicy("RequirePatient", policy => policy.RequireRole("Patient"));
});

// ========================
// 6. Build App
// ========================
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


// ========================
// 7. Routing
// ========================
app.MapControllers();
app.MapRazorPages();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
