using CourseWork.Models;
using Microsoft.AspNetCore.Identity;
using MongoDB.Driver;
using Сoursework.Models;

namespace CourseWork;

public static class DatabaseSeeder
{
    public static void SeedDatabase(IMongoDatabase database, IPasswordHasher<User> hasher)
    {
        // === Users Collection ===
        var usersCollection = database.GetCollection<User>("users");

        if (usersCollection.CountDocuments(FilterDefinition<User>.Empty) == 0)
        {
            var users = new List<User>
            {
                new User("admin", "", Role.Administrator) { FullName = "Admin User", Phone = "+380123456789" },
                new User("operator1", "", Role.Operator) { FullName = "Operator One", Phone = "+380987654321" },
                new User("patient1", "", Role.Patient) { FullName = "Patient One", MedicalRecordNumber = 1001 },
                new User("patient2", "", Role.Patient) { FullName = "Patient Two", MedicalRecordNumber = 1002 },
                new User("specialist1", "", Role.Specialist) { FullName = "Dr. Specialist", Speciality = "Therapist" }
            };

            foreach (var user in users)
            {
                user.SetPasswordHash("pass123", hasher);
            }

            usersCollection.InsertMany(users);
        }

        // === Visits Collection ===
        var visitsCollection = database.GetCollection<Visit>("visits");

        if (visitsCollection.CountDocuments(FilterDefinition<Visit>.Empty) == 0)
        {
            var specialistId = usersCollection.Find(u => u.UserRole == Role.Specialist).First().Id;

            var visits = new List<Visit>
            {
                new Visit(1001, specialistId, DateTime.UtcNow.AddDays(-30), VisitStatus.Completed,
                    isFirstVisit: true, anamnesis: "Regular check-up", diagnosis: "Healthy",
                    treatment: "Preventive care", recommendations: "Brush teeth twice a day",
                    serviceCost: 500, medicationCost: 0),

                new Visit(1001, specialistId, DateTime.UtcNow.AddDays(-25), VisitStatus.Completed,
                    isFirstVisit: false, anamnesis: "Mild toothache", diagnosis: "Early cavity",
                    treatment: "Filling", recommendations: "Avoid sugary foods for 2 days",
                    serviceCost: 700, medicationCost: 150),

                new Visit(1001, specialistId, DateTime.UtcNow.AddDays(-20), VisitStatus.Completed,
                    isFirstVisit: false, anamnesis: "Follow-up cleaning", diagnosis: "Healthy",
                    treatment: "Cleaning", recommendations: "Use mouthwash daily",
                    serviceCost: 400, medicationCost: 0),

                new Visit(1001, specialistId, DateTime.UtcNow.AddDays(-15), VisitStatus.Completed,
                    isFirstVisit: false, anamnesis: "Check pain in molar", diagnosis: "Cavity",
                    treatment: "Filling", recommendations: "Avoid sweets for 2 days",
                    serviceCost: 800, medicationCost: 100),

                new Visit(1001, specialistId, DateTime.UtcNow.AddDays(-10), VisitStatus.Completed,
                    isFirstVisit: false, anamnesis: "Routine follow-up", diagnosis: "Healthy",
                    treatment: "Cleaning", recommendations: "Brush and floss daily",
                    serviceCost: 450, medicationCost: 0),

                new Visit(1002, specialistId, DateTime.UtcNow.AddDays(-5), VisitStatus.Scheduled,
                    isFirstVisit: false, anamnesis: "Tooth pain", diagnosis: "Cavity",
                    treatment: "Filling", recommendations: "Avoid sweets for 2 days",
                    serviceCost: 800, medicationCost: 200)
            };

            visitsCollection.InsertMany(visits);
        }

        // === Payments Collection ===
        var paymentsCollection = database.GetCollection<Payment>("payments");

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
        var requestsCollection = database.GetCollection<RegistrationRequest>("registration_requests");

        if (requestsCollection.CountDocuments(FilterDefinition<RegistrationRequest>.Empty) == 0)
        {
            var requests = new List<RegistrationRequest>
            {
                new RegistrationRequest("newpatient1", "password123")
                    { FullName = "Oleh Koval", Phone = "+380666666666", Address = "Odessa, Ukraine" },
                new RegistrationRequest("newpatient2", "password123")
                    { FullName = "Natalia Sydorenko", Phone = "+380777777777", Address = "Kharkiv, Ukraine" }
            };
            requestsCollection.InsertMany(requests);
        }

        Console.WriteLine("MongoDB database seeded successfully!");
    }
}
