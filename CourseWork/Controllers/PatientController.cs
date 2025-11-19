using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Route("patient")]
[Authorize(Roles = "Patient")]
public class PatientController : Controller
{
    private readonly PatientService _patientService;
    private readonly VisitService _visitService;
    private readonly PaymentService _paymentService;
    private readonly SpecialistService _specialistService;

    public PatientController(
        PatientService patientService,
        VisitService visitService,
        PaymentService paymentService,
        SpecialistService specialistService)  // 🔥 додаємо
    {
        _patientService = patientService;
        _visitService = visitService;
        _paymentService = paymentService;
        _specialistService = specialistService;
    }

    private User GetCurrentPatient()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return null;
        return _patientService.GetById(userId);
    }

    // -------------------- DASHBOARD --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var patient = GetCurrentPatient();
        return patient == null ? Unauthorized() : Ok(patient);
    }

    // -------------------- VISITS --------------------
    [HttpGet("visits")]
    public IActionResult Visits()
    {
        var patient = GetCurrentPatient();
        if (patient == null || patient.MedicalRecordNumber == null)
            return Unauthorized();

        var visits = _visitService
            .GetAllVisits()
            .Where(v => v.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(v => v.VisitDate)
            .ToList();

        return Ok(visits);
    }

    // -------------------- BILLS --------------------
    [HttpGet("bills")]
    public IActionResult Bills()
    {
        var patient = GetCurrentPatient();
        if (patient == null || patient.MedicalRecordNumber == null)
            return Unauthorized();

        var payments = _paymentService
            .GetAllPayments()
            .Where(p => p.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(p => p.IssuedDate)
            .ToList();

        return Ok(payments);
    }

    // -------------------- PROFILE --------------------
    [HttpGet("profile")]
    public IActionResult Profile()
    {
        var patient = GetCurrentPatient();
        return patient == null ? Unauthorized() : Ok(patient);
    }

    [HttpPost("profile/update")]
    public IActionResult UpdateProfile(string fullName, string phone, string address)
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        patient.SetFullName(fullName);
        patient.SetContactInfo(phone, address);

        _patientService.UpdateUser(patient);
        return Ok();
    }

    [HttpPost("profile/password")]
    public IActionResult UpdatePassword(string newPassword)
    {
        var patient = GetCurrentPatient();
        if (patient == null) return Unauthorized();

        _patientService.UpdatePassword(patient.UserName, newPassword);
        return Ok();
    }

    // -------------------- SPECIALISTS --------------------

    // Отримати список всіх спеціалістів
    [HttpGet("specialists")]
    public IActionResult GetAllSpecialists()
    {
        var specialists = _specialistService.GetAllSpecialists();
        return Ok(specialists);
    }

    // Отримати список спеціалістів за спеціальністю (опційно)
    [HttpGet("specialists/by-specialty")]
    public IActionResult GetSpecialistsBySpecialty([FromQuery] string specialty)
    {
        if (string.IsNullOrWhiteSpace(specialty))
            return BadRequest("Specialty is required");

        var specialists = _specialistService.GetBySpecialty(specialty);
        return Ok(specialists);
    }
}
