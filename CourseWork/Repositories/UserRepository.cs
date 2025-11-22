using Microsoft.AspNetCore.Identity;
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
    
    public User GetByName(string username)
    {
        return Users.Find(u => u.UserName == username).FirstOrDefault();
    }
    
    public User GetById(string Id)
    {
        return Users.Find(u => u.Id == Id).FirstOrDefault();
    }
    
    public void UpdatePassword(string username, string newPassword, IPasswordHasher<User> hasher)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            throw new ArgumentException("New password cannot be empty.", nameof(newPassword));

        // 1. Знайти користувача
        var user = Users.Find(u => u.UserName == username).FirstOrDefault();

        if (user == null)
            throw new Exception($"User '{username}' does not exist.");

        // 2. Використати метод User.SetPasswordHash(...)
        user.SetPasswordHash(newPassword, hasher);

        // 3. Оновити запис в MongoDB
        var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, user.PasswordHash);

        Users.UpdateOne(filter, update);
    }

    
    public void UpdateUser(User updatedUser)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, updatedUser.Id);
        Users.ReplaceOne(filter, updatedUser);
    }
    
    public void DeleteUser(string id)
    {
        Users.DeleteOne(u => u.Id == id);
    }
}
