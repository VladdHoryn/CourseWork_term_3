using Microsoft.AspNetCore.Mvc;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Route("patient")]
public class PatientController : Controller
{
    private readonly PatientService _patientService;
    private readonly VisitService _visitService;
    private readonly PaymentService _paymentService;

    public PatientController(
        PatientService patientService,
        VisitService visitService,
        PaymentService paymentService)
    {
        _patientService = patientService;
        _visitService = visitService;
        _paymentService = paymentService;
    }

    // -------------------- DASHBOARD --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var username = User.Identity?.Name;

        var patient = _patientService.SearchBySurname(username).FirstOrDefault();
        if (patient == null)
            return RedirectToAction("Login", "Auth");

        return View(patient);
    }

    // -------------------- VISITS LIST --------------------
    [HttpGet("visits")]
    public IActionResult Visits()
    {
        var username = User.Identity?.Name;
        var patient = _patientService.SearchBySurname(username).FirstOrDefault();

        if (patient == null || patient.MedicalRecordNumber == null)
            return RedirectToAction("dashboard");

        var visits = _visitService
            .GetAllVisits()
            .Where(v => v.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(v => v.VisitDate)
            .ToList();

        return View(visits);
    }

    // -------------------- PAYMENTS / BILLS --------------------
    [HttpGet("bills")]
    public IActionResult Bills()
    {
        var username = User.Identity?.Name;
        var patient = _patientService.SearchBySurname(username).FirstOrDefault();

        if (patient == null || patient.MedicalRecordNumber == null)
            return RedirectToAction("dashboard");

        var payments = _paymentService
            .GetAllPayments()
            .Where(p => p.PatientMedicalRecord == patient.MedicalRecordNumber.Value)
            .OrderByDescending(p => p.IssuedDate)
            .ToList();

        return View(payments);
    }

    // -------------------- PAY BILL --------------------
    [HttpPost("bills/pay/{id}")]
    public IActionResult PayBill(string id, decimal amount)
    {
        var payment = _paymentService.GetPaymentById(id);

        try
        {
            payment.ProcessPayment(amount);
            _paymentService.UpdatePayment(id, payment);
        }
        catch (Exception ex)
        {
            TempData["Error"] = ex.Message;
        }

        return RedirectToAction("Bills");
    }

    // -------------------- PROFILE VIEW --------------------
    [HttpGet("profile")]
    public IActionResult Profile()
    {
        var username = User.Identity?.Name;
        var patient = _patientService.SearchBySurname(username).FirstOrDefault();

        if (patient == null)
            return RedirectToAction("dashboard");

        return View(patient);
    }

    // -------------------- UPDATE PROFILE --------------------
    [HttpPost("profile/update")]
    public IActionResult UpdateProfile(string fullName, string phone, string address)
    {
        var username = User.Identity?.Name;
        var patient = _patientService.SearchBySurname(username).FirstOrDefault();

        if (patient != null)
        {
            patient.SetFullName(fullName);
            patient.SetContactInfo(phone, address);
            _patientService.UpdateUser(patient);
        }

        return RedirectToAction("Profile");
    }

    // -------------------- CHANGE PASSWORD --------------------
    [HttpPost("profile/password")]
    public IActionResult UpdatePassword(string newPassword)
    {
        var username = User.Identity?.Name;
        _patientService.UpdatePassword(username, newPassword);

        return RedirectToAction("Profile");
    }
}