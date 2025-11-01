using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class OperatorRepository
{
    private readonly IMongoCollection<User> _users;

    public OperatorRepository(MongoDBRepository db)
    {
        _users = db.GetCollection<User>("users");
    }

    public List<User> GetAllOperators() =>
        _users.Find(u => u.UserRole == Role.Operator).ToList();
}