using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class SpecialistRepository : UserRepository
{
    // private readonly IMongoCollection<User> Users;

    public SpecialistRepository(MongoDBRepository db) : base(db) {}

    public List<User> GetAllSpecialists() =>
        Users.Find(u => u.UserRole == Role.Specialist).ToList();

    public List<User> GetBySpecialty(string specialty)
    {
        return Users.Find(u => u.UserRole == Role.Specialist && u.Speciality == specialty).ToList();
    }

    public int CountBySpecialty(string specialty)
    {
        return (int)Users.CountDocuments(u => u.UserRole == Role.Specialist && u.Speciality == specialty);
    }
    
    //  Task 7: Get list and count of doctors by specialty
    public List<User> GetDoctorsBySpecialty(string specialty)
    {
        var filter = Builders<User>.Filter.And(
            Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist),
            Builders<User>.Filter.Eq(u => u.Speciality, specialty)
        );
        return Users.Find(filter).ToList();
    }
    
    public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    {
        var filter = Builders<User>.Filter.Eq(u => u.UserRole, Role.Specialist);
        var doctors = Users.Find(filter).ToList();
        
        return doctors
            .Where(d => !string.IsNullOrEmpty(d.Speciality))
            .GroupBy(d => d.Speciality)
            .ToDictionary(g => g.Key, g => g.Count());
    }
}