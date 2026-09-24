export function toSafeUser(user) {
    const safe = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
    };

    if (user.rollNo) {
        safe.rollNo = user.rollNo;
    }

    return safe;
}
