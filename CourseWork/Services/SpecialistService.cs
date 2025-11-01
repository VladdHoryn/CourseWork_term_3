using CourseWork.Repositories;
using Сoursework.Models;

namespace Сoursework.Services;

public class SpecialistService
{
    private readonly SpecialistRepository _repo;

    public SpecialistService(SpecialistRepository repo)
    {
        _repo = repo;
    }
    
    public List<User> GetAllSpecialists()
    {
        var specialists = _repo.GetAllSpecialists();
        return specialists.OrderBy(s => s.FullName).ToList();
    }

    public List<User> GetBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        return _repo.GetBySpecialty(specialty);
    }

    public int CountBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        return _repo.CountBySpecialty(specialty);
    }
    
    //  Task 7: Get list and count of doctors by specialty
    public List<User> GetDoctorsBySpecialty(string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            throw new ArgumentException("Specialty cannot be empty.");

        var doctors = _repo.GetDoctorsBySpecialty(specialty);
        if (doctors.Count == 0)
            Console.WriteLine($"No doctors found for specialty: {specialty}");

        return doctors;
    }
    
    public Dictionary<string, int> GetAllDoctorsGroupedBySpecialty()
    {
        var grouped = _repo.GetAllDoctorsGroupedBySpecialty();

        if (grouped.Count == 0)
            Console.WriteLine("No specialists found in the system.");

        return grouped;
    }
}