using CourseWork.Models;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using Сoursework.Models;

namespace CourseWork;

public static class DatabaseSeeder
{
    private readonly static IPasswordHasher<User> _hasher;

    public static void SeedDatabase(IMongoDatabase database)
    {
        // === Users Collection ===
        var users = new List<User>
        {
            new User("admin", "", Role.Administrator) { FullName = "Admin User", Phone = "+380123456789" },
            new User("operator1", "", Role.Operator) { FullName = "Operator One", Phone = "+380987654321" },
            new User("patient1", "", Role.Patient) { FullName = "Patient One", MedicalRecordNumber = 1001 },
            new User("specialist1", "", Role.Specialist) { FullName = "Dr. Specialist", Speciality = "Therapist" }
        };

        foreach (var user in users)
        {
            user.SetPasswordHash("pass123", _hasher);
        }

        var collection = database.GetCollection<User>("users");
        collection.InsertMany(users);

        // === Visits Collection ===
        var visitsCollection = database.GetCollection<Visit>("Visits");
        var usersCollection = database.GetCollection<User>("Users");

        if (visitsCollection.CountDocuments(FilterDefinition<Visit>.Empty) == 0)
        {
            var specialistId = usersCollection.Find(u => u.UserRole == Role.Specialist).First().Id;

            var visits = new List<Visit>
            {
                new Visit(
                    patientMedicalRecord: 1001,
                    specialistId: specialistId,
                    visitDate: DateTime.UtcNow.AddDays(-30),
                    status: VisitStatus.Completed,
                    isFirstVisit: true,
                    anamnesis: "Regular check-up",
                    diagnosis: "Healthy",
                    treatment: "Preventive care",
                    recommendations: "Brush teeth twice a day",
                    serviceCost: 500,
                    medicationCost: 0
                ),
                new Visit(
                    patientMedicalRecord: 1001,
                    specialistId: specialistId,
                    visitDate: DateTime.UtcNow.AddDays(-20),
                    status: VisitStatus.Completed,
                    isFirstVisit: false,
                    anamnesis: "Mild toothache",
                    diagnosis: "Early cavity",
                    treatment: "Filling",
                    recommendations: "Avoid sugary foods for 2 days",
                    serviceCost: 700,
                    medicationCost: 150
                ),
                new Visit(
                    patientMedicalRecord: 1001,
                    specialistId: specialistId,
                    visitDate: DateTime.UtcNow.AddDays(-10),
                    status: VisitStatus.Completed,
                    isFirstVisit: false,
                    anamnesis: "Routine follow-up",
                    diagnosis: "Healthy",
                    treatment: "Cleaning",
                    recommendations: "Use mouthwash daily",
                    serviceCost: 400,
                    medicationCost: 0
                ),
                new Visit(
                    patientMedicalRecord: 1002,
                    specialistId: specialistId,
                    visitDate: DateTime.UtcNow.AddDays(-5),
                    status: VisitStatus.Scheduled,
                    isFirstVisit: false,
                    anamnesis: "Tooth pain",
                    diagnosis: "Cavity",
                    treatment: "Filling",
                    recommendations: "Avoid sweets for 2 days",
                    serviceCost: 800,
                    medicationCost: 200
                )
            };

            visitsCollection.InsertMany(visits);
        }

        // === Payments Collection ===
        var paymentsCollection = database.GetCollection<Payment>("Payments");
        if (paymentsCollection.CountDocuments(FilterDefinition<Payment>.Empty) == 0)
        {
            var allVisits = visitsCollection.Find(FilterDefinition<Visit>.Empty).ToList();
            var payments = new List<Payment>
            {
                new Payment(allVisits[0].Id, allVisits[0].PatientMedicalRecord, 500, 500)
                    { Status = PaymentStatus.Paid },
                new Payment(allVisits[1].Id, allVisits[1].PatientMedicalRecord, 1000, 0)
                    { Status = PaymentStatus.Pending }
            };
            paymentsCollection.InsertMany(payments);
        }

        // === Registration Requests Collection ===
        var requestsCollection = database.GetCollection<RegistrationRequest>("RegistrationRequests");
        if (requestsCollection.CountDocuments(FilterDefinition<RegistrationRequest>.Empty) == 0)
        {
            var requests = new List<RegistrationRequest>
            {
                new RegistrationRequest("newpatient1", "password123")
                    { FullName = "Олег Коваль", Phone = "+380666666666", Address = "Одеса, Україна" },
                new RegistrationRequest("newpatient2", "password123")
                    { FullName = "Наталія Сидоренко", Phone = "+380777777777", Address = "Харків, Україна" }
            };
            requestsCollection.InsertMany(requests);
        }

        Console.WriteLine("MongoDB database seeded successfully!");
    }
}