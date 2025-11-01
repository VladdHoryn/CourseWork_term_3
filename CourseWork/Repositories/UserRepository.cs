using MongoDB.Driver;
using Сoursework.Models;

namespace Сoursework.Repositories;

public class UserRepository
{
    private readonly IMongoCollection<User> _db_collection;
    private readonly IMongoCollection<Visit> _visits_collection;

    public UserRepository(MongoDBRepository db)
    {
        _db_collection = db.GetCollection<User>("users");
        _visits_collection = db.GetCollection<Visit>("visits");
    }
    
    //  Existing basic CRUD methods
    public List<User> GetAllUsers()
    {
        return _db_collection.Find(_ => true).ToList();
    }
    
    public void CreateUser(User user)
    {
        _db_collection.InsertOne(user);
    }
    
    public User GetUserByName(string username)
    {
        return _db_collection.Find(u => u.UserName == username).FirstOrDefault();
    }
    
    public void UpdatePassword(string username, string newPassword)
    {
        var filter = Builders<User>.Filter.Eq(u => u.UserName, username);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(newPassword));
        _db_collection.UpdateOne(filter, update);
    }
    
    public void DeleteUser(string username)
    {
        _db_collection.DeleteOne(u => u.UserName == username);
    }

    // //  Task 1: Get patient information by surname or medical record number
    // public User GetPatientByMedicalRecord(int medicalRecordNumber)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
    //         Builders<User>.Filter.Eq(u => u.MedicalRecordNumber, medicalRecordNumber)
    //     );
    //     return _db_collection.Find(filter).FirstOrDefault();
    // }

    // public List<User> GetPatientsBySurname(string surname)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
    //         Builders<User>.Filter.Regex(u => u.FullName, new MongoDB.Bson.BsonRegularExpression(surname, "i"))
    //     );
    //     return _db_collection.Find(filter).ToList();
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
    //     var patients = _db_collection.Find(filter).ToList();
    //
    //     // Filter by specialist if provided
    //     if (!string.IsNullOrEmpty(specialistId))
    //     {
    //         var visitFilter = Builders<Visit>.Filter.Eq(v => v.SpecialistId, specialistId);
    //         var patientRecords = _visits_collection.Find(visitFilter)
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
    //     return _db_collection.Find(filter).ToList();
    // }

    // public int GetDoctorsCountBySpecialty(string specialty)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
    //         Builders<User>.Filter.Eq(u => u.Speciality, specialty)
    //     );
    //     return (int)_db_collection.CountDocuments(filter);
    // }

    // public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    // {
    //     var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
    //     var doctors = _db_collection.Find(filter).ToList();
    //     
    //     return doctors
    //         .Where(d => !string.IsNullOrEmpty(d.Speciality))
    //         .GroupBy(d => d.Speciality)
    //         .ToDictionary(g => g.Key, g => g.Count());
    // }

    // public List<User> GetAllDoctors()
    // {
    //     var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
    //     return _db_collection.Find(filter).ToList();
    // }
    //
    // public User GetDoctorById(string doctorId)
    // {
    //     var filter = Builders<User>.Filter.And(
    //         Builders<User>.Filter.Eq(u => u.Id, doctorId),
    //         Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist)
    //     );
    //     return _db_collection.Find(filter).FirstOrDefault();
    // }
}
