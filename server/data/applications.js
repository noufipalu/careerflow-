let applications = [
    {
        id: 1,
        company: "Google",
        position: "Software Engineer",
        status: "Applied"
    },
    {
        id: 2,
        company: "Microsoft",
        position: "Frontend Developer",
        status: "Interview"
    }
];

function deleteApplicationById(id) {
    const index = applications.findIndex((app) => app.id === id);

    if (index === -1) {
        return false;
    }

    applications.splice(index, 1);
    return true;
}

export { applications, deleteApplicationById };
