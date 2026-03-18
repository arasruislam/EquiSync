import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User, { IUser } from "@/models/User";
import AuditLog from "@/models/AuditLog";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select("+passwordHash");

        if (!user || !user.isActive) {
          throw new Error("No user found with this email or account is inactive");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password");
        }

        // Login successful - returning user session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.image = (user as any).image;
      }
      
      if (trigger === "update") {
        if (session?.name) token.name = session.name;
        if (session?.image) token.image = session.image;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 20 * 60, // 20 minutes for bank-level security
  },
  secret: process.env.NEXTAUTH_SECRET,
};
