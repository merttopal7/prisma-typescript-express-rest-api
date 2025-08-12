import { Temir } from './temir'

const routes = Temir.router();
const database = Temir.database();

routes.public.get("/", async (req, res) => {
    return res.json({
        ...await database.queryWrapper(database.prisma.user.findMany())
    });
});

routes.protected.get("/tt",(req,res) => {
    return res.json({
        message: "TAAA"
    });
})

Temir.listen();