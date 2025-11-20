using MongoDB.Bson;
using MongoDB.Driver;
using Сoursework.Models;

namespace Сoursework.Repositories;

public class VisitRepository
{
    private readonly IMongoCollection<Visit> _db_collection;
    private readonly IMongoCollection<User> _users_collection;
    private readonly UserRepository _userRepository;

    public VisitRepository(MongoDBRepository db)
    {
        _db_collection = db.GetCollection<Visit>("visits");
        _users_collection = db.GetCollection<User>("users");
    }
    
    //  Existing basic CRUD methods
    public List<Visit> GetAllVisits()
    {
        return _db_collection.Find(_ => true).ToList();
    }
    
    public void CreateVisit(Visit visit)
    {
        _db_collection.InsertOne(visit);
    }
    
    public Visit GetVisitById(string id)
    {
        return _db_collection.Find(u => u.Id == id).FirstOrDefault();
    }
    
    public void UpdateVisit(string id, Visit visit)
    {
        var filter = Builders<Visit>.Filter.Eq(u => u.Id, id);
        _db_collection.ReplaceOne(filter, visit);
    }
    
    public void DeleteVisit(string id)
    {
        _db_collection.DeleteOne(u => u.Id == id);
    }

    //  Task 2: Get total service cost for patient per year
    public decimal GetPatientTotalCostByYear(int medicalRecordNumber, int year)
    {
        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year, 12, 31, 23, 59, 59);

        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.PatientMedicalRecord, medicalRecordNumber),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        return visits.Sum(v => v.TotalCost);
    }

    public Dictionary<string, decimal> GetPatientCostBreakdownByYear(int medicalRecordNumber, int year)
    {
        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year, 12, 31, 23, 59, 59);

        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.PatientMedicalRecord, medicalRecordNumber),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        
        return new Dictionary<string, decimal>
        {
            { "ServiceCost", visits.Sum(v => v.ServiceCost) },
            { "MedicationCost", visits.Sum(v => v.MedicationCost) },
            { "TotalCost", visits.Sum(v => v.TotalCost) }
        };
    }

    //  Task 4: Get average number of patients per day for doctors
    public double GetAveragePatientsPerDayForDoctor(string doctorId, DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.SpecialistId, doctorId),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        
        if (!visits.Any())
            return 0;

        var totalDays = (endDate - startDate).Days + 1;
        return (double)visits.Count / totalDays;
    }

    public double GetAveragePatientsPerDayForAllDoctors(DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        
        if (!visits.Any())
            return 0;

        var totalDays = (endDate - startDate).Days + 1;
        return (double)visits.Count / totalDays;
    }

    public double GetAveragePatientsPerDayBySpecialty(string specialty, DateTime startDate, DateTime endDate)
    {
        // Get all doctors with this specialty
        var doctorFilter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
            Builders<User>.Filter.Eq(u => u.Speciality, specialty)
        );
        var doctorIds = _users_collection.Find(doctorFilter).ToList().Select(d => d.Id).ToList();

        if (!doctorIds.Any())
            return 0;

        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.In(v => v.SpecialistId, doctorIds),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        
        if (!visits.Any())
            return 0;

        var totalDays = (endDate - startDate).Days + 1;
        return (double)visits.Count / totalDays;
    }

    public Dictionary<string, double> GetAveragePatientsPerDayByAllDoctors(DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        var totalDays = (endDate - startDate).Days + 1;

        var doctorIds = visits.Select(v => v.SpecialistId).Distinct().ToList();
        var doctors = _users_collection.Find(Builders<User>.Filter.In(u => u.Id, doctorIds)).ToList();

        var result = new Dictionary<string, double>();
        
        foreach (var doctor in doctors)
        {
            var doctorVisits = visits.Where(v => v.SpecialistId == doctor.Id).Count();
            result[doctor.FullName ?? doctor.UserName] = (double)doctorVisits / totalDays;
        }

        return result;
    }

    //  Task 6: Get patients treated by doctor of specific specialty
    public List<int> GetPatientsMedicalRecordsBySpecialty(string specialty)
    {
        // Get all doctors with this specialty
        var doctorFilter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
            Builders<User>.Filter.Eq(u => u.Speciality, specialty)
        );
        var doctorIds = _users_collection.Find(doctorFilter).ToList().Select(d => d.Id).ToList();

        if (!doctorIds.Any())
            return new List<int>();

        var filter = Builders<Visit>.Filter.In(v => v.SpecialistId, doctorIds);
        
        return _db_collection.Find(filter)
            .ToList()
            .Select(v => v.PatientMedicalRecord)
            .Distinct()
            .ToList();
    }

     public List<User> GetPatientsBySpecialty(string specialty)
     {
         var medicalRecords = GetPatientsMedicalRecordsBySpecialty(specialty);
         
         if (!medicalRecords.Any())
             return new List<User>();

         var filter = Builders<User>.Filter.In(u => u.MedicalRecordNumber, medicalRecords.Cast<int?>());
         return _users_collection.Find(filter).ToList();
     }

    //  Task 8: Calculate revenue per specialist for period
    public decimal GetDoctorRevenueForPeriod(string doctorId, DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.SpecialistId, doctorId),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        return visits.Sum(v => v.TotalCost);
    }

    public Dictionary<string, decimal> GetAllDoctorsRevenueForPeriod(DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        var doctorIds = visits.Select(v => v.SpecialistId).Distinct().ToList();
        var doctors = _users_collection.Find(Builders<User>.Filter.In(u => u.Id, doctorIds)).ToList();

        var result = new Dictionary<string, decimal>();
        
        foreach (var doctor in doctors)
        {
            var revenue = visits.Where(v => v.SpecialistId == doctor.Id).Sum(v => v.TotalCost);
            result[doctor.FullName ?? doctor.UserName] = revenue;
        }

        return result;
    }

    //  Task 9: Calculate visits per month total and by specialty
    public int GetTotalVisitsForMonth(int year, int month)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        return (int)_db_collection.CountDocuments(filter);
    }

    public Dictionary<string, int> GetVisitsBySpecialtyForMonth(int year, int month)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        var doctorIds = visits.Select(v => v.SpecialistId).Distinct().ToList();
        var doctors = _users_collection.Find(Builders<User>.Filter.In(u => u.Id, doctorIds)).ToList();

        var result = new Dictionary<string, int>();
        
        foreach (var doctor in doctors)
        {
            var specialty = doctor.Speciality ?? "Unknown";
            var count = visits.Count(v => v.SpecialistId == doctor.Id);
            
            if (result.ContainsKey(specialty))
                result[specialty] += count;
            else
                result[specialty] = count;
        }

        return result;
    }

    //  Task 10: Calculate medication costs for patient for period
    public decimal GetPatientMedicationCostForPeriod(int medicalRecordNumber, DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.PatientMedicalRecord, medicalRecordNumber),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        return visits.Sum(v => v.MedicationCost);
    }

    public Dictionary<string, decimal> GetPatientCostBreakdownForPeriod(int medicalRecordNumber, DateTime startDate, DateTime endDate)
    {
        var filter = Builders<Visit>.Filter.And(
            Builders<Visit>.Filter.Eq(v => v.PatientMedicalRecord, medicalRecordNumber),
            Builders<Visit>.Filter.Eq(v => v.Status, VisitStatus.Completed),
            Builders<Visit>.Filter.Gte(v => v.VisitDate, startDate),
            Builders<Visit>.Filter.Lte(v => v.VisitDate, endDate)
        );

        var visits = _db_collection.Find(filter).ToList();
        
        return new Dictionary<string, decimal>
        {
            { "ServiceCost", visits.Sum(v => v.ServiceCost) },
            { "MedicationCost", visits.Sum(v => v.MedicationCost) },
            { "TotalCost", visits.Sum(v => v.TotalCost) }
        };
    }

    // Helper methods
    public List<Visit> GetVisitsByPatient(int medicalRecordNumber)
    {
        var filter = Builders<Visit>.Filter.Eq(v => v.PatientMedicalRecord, medicalRecordNumber);
        return _db_collection.Find(filter).ToList();
    }

    public List<Visit> GetVisitsByDoctor(string doctorId)
    {
        var filter = Builders<Visit>.Filter.Eq(v => v.SpecialistId, doctorId);
        return _db_collection.Find(filter).ToList();
    }
}