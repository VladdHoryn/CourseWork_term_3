using MongoDB.Driver;
using Сoursework.Models;

namespace Сoursework.Repositories;

public class UserRepository
{
    protected readonly IMongoCollection<User> Users;
    protected readonly IMongoCollection<Visit> Visits;

    public UserRepository(MongoDBRepository db)
    {
        Users = db.GetCollection<User>("users");
        Visits = db.GetCollection<Visit>("visits");
    }
    
    //  Existing basic CRUD methods
    public List<User> GetAllUsers()
    {
        return Users.Find(_ => true).ToList();
    }
    
    public void CreateUser(User user)
    {
        Users.InsertOne(user);
    }
    
    public User GetUserByName(string username)
    {
        return Users.Find(u => u.UserName == username).FirstOrDefault();
    }
    
    public void UpdatePassword(string username, string newPassword)
    {
        var filter = Builders<User>.Filter.Eq(u => u.UserName, username);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(newPassword));
        Users.UpdateOne(filter, update);
    }
    
    public void DeleteUser(string username)
    {
        Users.DeleteOne(u => u.UserName == username);
    }

    // //  Task 1: Get patient information by surname or medical record number
    // public User GetPatientByMedicalRecord(int medicalRecordNumber)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
    //         Builders<User>.Filter.Eq(u => u.MedicalRecordNumber, medicalRecordNumber)
    //     );
    //     return Users.Find(filter).FirstOrDefault();
    // }

    // public List<User> GetPatientsBySurname(string surname)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
    //         Builders<User>.Filter.Regex(u => u.FullName, new MongoDB.Bson.BsonRegularExpression(surname, "i"))
    //     );
    //     return Users.Find(filter).ToList();
    // }

    // //  Task 5: Get list of patients by various criteria
    // public List<User> GetPatientsByFilters(DateTime? birthDateFrom = null, DateTime? birthDateTo = null, 
    //     string specialistId = null, string healthStatus = null)
    // {
    //     var filterBuilder = Builders<User>.Filter;
    //     var filters = new List<FilterDefinition<User>>
    //     {
    //         filterBuilder.Eq(u => u.UserRole, Role.Patient)
    //     };
    //
    //     if (birthDateFrom.HasValue)
    //     {
    //         filters.Add(filterBuilder.Gte(u => u.DateOfBirth, birthDateFrom.Value));
    //     }
    //
    //     if (birthDateTo.HasValue)
    //     {
    //         filters.Add(filterBuilder.Lte(u => u.DateOfBirth, birthDateTo.Value));
    //     }
    //
    //     var filter = filterBuilder.And(filters);
    //     var patients = Users.Find(filter).ToList();
    //
    //     // Filter by specialist if provided
    //     if (!string.IsNullOrEmpty(specialistId))
    //     {
    //         var visitFilter = Builders<Visit>.Filter.Eq(v => v.SpecialistId, specialistId);
    //         var patientRecords = Visits.Find(visitFilter)
    //             .ToList()
    //             .Select(v => v.PatientMedicalRecord)
    //             .Distinct()
    //             .ToList();
    //
    //         patients = patients.Where(p => p.MedicalRecordNumber.HasValue && 
    //                                       patientRecords.Contains(p.MedicalRecordNumber.Value)).ToList();
    //     }
    //
    //     return patients;
    // }

    // //  Task 7: Get list and count of doctors by specialty
    // public List<User> GetDoctorsBySpecialty(string specialty)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
    //         Builders<User>.Filter.Eq(u => u.Speciality, specialty)
    //     );
    //     return Users.Find(filter).ToList();
    // }

    // public int GetDoctorsCountBySpecialty(string specialty)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
    //         Builders<User>.Filter.Eq(u => u.Speciality, specialty)
    //     );
    //     return (int)Users.CountDocuments(filter);
    // }

    // public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    // {
    //     var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
    //     var doctors = Users.Find(filter).ToList();
    //     
    //     return doctors
    //         .Where(d => !string.IsNullOrEmpty(d.Speciality))
    //         .GroupBy(d => d.Speciality)
    //         .ToDictionary(g => g.Key, g => g.Count());
    // }

    // public List<User> GetAllDoctors()
    // {
    //     var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
    //     return Users.Find(filter).ToList();
    // }
    //
    // public User GetDoctorById(string doctorId)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.Id, doctorId),
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist)
    //     );
    //     return Users.Find(filter).FirstOrDefault();
    // }
}
