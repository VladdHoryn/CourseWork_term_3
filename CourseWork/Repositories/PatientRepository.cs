using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class PatientRepository
{
    private readonly IMongoCollection<User> _users;
    private readonly IMongoCollection<Visit> _visits;

    public PatientRepository(MongoDBRepository db)
    {
        _users = db.GetCollection<User>("users");
        _visits = db.GetCollection<Visit>("visits");
    }

    public List<User> GetAllPatients()
    {
        return _users.Find(u => u.UserRole == Role.Patient).ToList();
    }

    // public User? GetByMedicalRecord(int record)
    // {
    //     return _users.Find(u => u.UserRole == Role.Patient && u.MedicalRecordNumber == record).FirstOrDefault();
    // }

    public List<User> GetBySurname(string surname)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
            Builders<User>.Filter.Regex(u => u.FullName, new MongoDB.Bson.BsonRegularExpression(surname, "i"))
        );
        return _users.Find(filter).ToList();
    }
    
    //  Task 1: Get patient information by surname or medical record number
    public User GetPatientByMedicalRecord(int medicalRecordNumber)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Patient),
            Builders<User>.Filter.Eq(u => u.MedicalRecordNumber, medicalRecordNumber)
        );
        return _users.Find(filter).FirstOrDefault();
    }
    
    //  Task 5: Get list of patients by various criteria
    public List<User> GetPatientsByFilters(DateTime? birthDateFrom = null, DateTime? birthDateTo = null, 
        string specialistId = null, string healthStatus = null)
    {
        var filterBuilder = Builders<User>.Filter;
        var filters = new List<FilterDefinition<User>>
        {
            filterBuilder.Eq(u => u.UserRole, Role.Patient)
        };

        if (birthDateFrom.HasValue)
        {
            filters.Add(filterBuilder.Gte(u => u.DateOfBirth, birthDateFrom.Value));
        }

        if (birthDateTo.HasValue)
        {
            filters.Add(filterBuilder.Lte(u => u.DateOfBirth, birthDateTo.Value));
        }

        var filter = filterBuilder.And(filters);
        var patients = _users.Find(filter).ToList();

        // Filter by specialist if provided
        if (!string.IsNullOrEmpty(specialistId))
        {
            var visitFilter = Builders<Visit>.Filter.Eq(v => v.SpecialistId, specialistId);
            var patientRecords = _visits.Find(visitFilter)
                .ToList()
                .Select(v => v.PatientMedicalRecord)
                .Distinct()
                .ToList();

            patients = patients.Where(p => p.MedicalRecordNumber.HasValue && 
                                           patientRecords.Contains(p.MedicalRecordNumber.Value)).ToList();
        }

        return patients;
    }
}