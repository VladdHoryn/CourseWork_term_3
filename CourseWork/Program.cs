using Сoursework.Models;
using Сoursework.Repositories;
using Сoursework.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();//added

// 1. Налаштування MongoDB
var mongoDbSettings = builder.Configuration.GetSection("MongoDbSettings");
var connectionString = mongoDbSettings["ConnectionString"] ?? throw new InvalidOperationException("MongoDB ConnectionString not found.");
var dbName = mongoDbSettings["DatabaseName"] ?? throw new InvalidOperationException("MongoDB DatabaseName not found.");

// Реєстрація MongoDBRepository як Singleton
builder.Services.AddSingleton(new MongoDBRepository(connectionString, dbName));

// 2. Реєстрація репозиторіїв
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<VisitRepository>();
builder.Services.AddScoped<PaymentRepository>();

// 3. Реєстрація сервісів (Бізнес-логіка)
builder.Services.AddScoped<UserService>();
// Створення нових сервісів
builder.Services.AddScoped<VisitService>(); 
builder.Services.AddScoped<PaymentService>(); 

// Додавання сервісів для Razor Pages/MVC та авторизації
builder.Services.AddRazorPages();
builder.Services.AddAuthentication("CookieAuth")
    .AddCookie("CookieAuth", options =>
    {
        options.Cookie.Name = "DentalClinicAuthCookie";
        options.LoginPath = "/Account/Login";
        options.AccessDeniedPath = "/AccessDenied";
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Administrator"));
    options.AddPolicy("RequireOperator", policy => policy.RequireRole("Administrator", "Operator"));
    options.AddPolicy("RequireSpecialist", policy => policy.RequireRole("Administrator", "Specialist"));
    options.AddPolicy("RequirePatient", policy => policy.RequireRole("Patient"));
});


var app = builder.Build();

// Налаштування HTTP-запитів
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// Включення автентифікації та авторизації
app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();

app.MapStaticAssets();//added

app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();//added

app.Run();