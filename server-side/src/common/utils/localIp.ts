import * as os from "os";

export const getLocalIP = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        const netArray = nets[name];
        if (netArray) {
            for (const net of netArray) {
                if (net.family === "IPv4" && !net.internal) {
                    return net.address;
                }
            }
        }
    }

    return "127.0.0.1";
};
