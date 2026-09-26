namespace frontend.Services;

public class AuthUser
{
    public int Id { get; set; }

    public string FullName { get; set; } = "";

    public string Email { get; set; } = "";

    public string Password { get; set; } = "";

    public string Phone { get; set; } = "";

    public string Location { get; set; } = "";

    public DateTime CreatedAt { get; set; }
}


public class AuthStore
{
    private int nextId = 2;


    public List<AuthUser> Users { get; } = new()
    {
        new AuthUser
        {
            Id = 1,
            FullName = "Sebastian",
            Email = "demo@smartcar.at",
            Password = "1234",
            Phone = "",
            Location = "Linz",
            CreatedAt = DateTime.Today
        }
    };


    public AuthUser? CurrentUser { get; private set; }


    public bool IsLoggedIn =>
        CurrentUser is not null;


    public bool Login(
        string email,
        string password,
        out string errorMessage)
    {
        errorMessage = "";


        var user =
            Users.FirstOrDefault(user =>
                user.Email.Equals(
                    email.Trim(),
                    StringComparison.OrdinalIgnoreCase));


        if (user is null)
        {
            errorMessage =
                "No account with this email was found.";

            return false;
        }


        if (user.Password != password)
        {
            errorMessage =
                "Incorrect password.";

            return false;
        }


        CurrentUser = user;

        return true;
    }


    public bool Register(
        string fullName,
        string email,
        string password,
        out string errorMessage)
    {
        errorMessage = "";


        if (Users.Any(user =>
            user.Email.Equals(
                email.Trim(),
                StringComparison.OrdinalIgnoreCase)))
        {
            errorMessage =
                "An account with this email already exists.";

            return false;
        }


        var user =
            new AuthUser
            {
                Id = nextId++,

                FullName =
                    fullName.Trim(),

                Email =
                    email.Trim(),

                Password =
                    password,

                CreatedAt =
                    DateTime.Today
            };


        Users.Add(user);

        CurrentUser = user;

        return true;
    }


    public void UpdateProfile(
        string fullName,
        string phone,
        string location)
    {
        if (CurrentUser is null)
        {
            return;
        }


        CurrentUser.FullName =
            fullName.Trim();

        CurrentUser.Phone =
            phone.Trim();

        CurrentUser.Location =
            location.Trim();
    }


    public void Logout()
    {
        CurrentUser = null;
    }
}