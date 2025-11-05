using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class OperatorRepository : UserRepository
{
    public OperatorRepository(MongoDBRepository db): base(db) {}

    public List<User> GetAllOperators() =>
        Users.Find(u => u.UserRole == Role.Operator).ToList();
}