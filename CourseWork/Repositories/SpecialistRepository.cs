using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class SpecialistRepository
{
    private readonly IMongoCollection<User> _users;

    public SpecialistRepository(MongoDBRepository db)
    {
        _users = db.GetCollection<User>("users");
    }

    public List<User> GetAllSpecialists() =>
        _users.Find(u => u.UserRole == Role.Specialist).ToList();

    public List<User> GetBySpecialty(string specialty)
    {
        return _users.Find(u => u.UserRole == Role.Specialist && u.Speciality == specialty).ToList();
    }

    public int CountBySpecialty(string specialty)
    {
        return (int)_users.CountDocuments(u => u.UserRole == Role.Specialist && u.Speciality == specialty);
    }
    
    //  Task 7: Get list and count of doctors by specialty
    public List<User> GetDoctorsBySpecialty(string specialty)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
            Builders<User>.Filter.Eq(u => u.Speciality, specialty)
        );
        return _users.Find(filter).ToList();
    }
    
    public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    {
        var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
        var doctors = _users.Find(filter).ToList();
        
        return doctors
            .Where(d => !string.IsNullOrEmpty(d.Speciality))
            .GroupBy(d => d.Speciality)
            .ToDictionary(g => g.Key, g => g.Count());
    }
}