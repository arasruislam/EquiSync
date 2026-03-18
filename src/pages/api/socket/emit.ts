import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "./io";

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  try {
    const { event, data } = req.body;
    
    if (res.socket.server.io) {
      res.socket.server.io.emit(event, data);
      return res.status(200).json({ success: true, message: `Emitted ${event}` });
    } else {
      console.warn("Socket.io not initialized on res.socket.server.io");
      return res.status(500).json({ error: "Socket.io not initialized" });
    }
  } catch (error) {
    console.error("Socket emit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
