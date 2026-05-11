import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from './middleware/auth';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();
const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as string;

// Middleware
app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET as string);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET as string);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running smoothly with Multi-User support!' });
});

// Protected Categories
app.get('/api/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', authenticate, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const newCat = await prisma.category.create({
      data: { name, userId: req.userId! }
    });
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Protected Links
app.get('/api/links', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.userId },
      orderBy: { id: 'desc' }
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

app.post('/api/links', authenticate, async (req: AuthRequest, res: Response) => {
  const { url, title, description, categoryId } = req.body;
  if (!url || !title || !categoryId) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const newLink = await prisma.link.create({
      data: {
        url,
        title,
        description: description || "",
        categoryId,
        userId: req.userId!,
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isFavorite: false
      }
    });
    res.status(201).json(newLink);
  } catch (error) {
    console.error("Create link error:", error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

app.delete('/api/links/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.link.delete({
      where: { id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

app.patch('/api/links/:id/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const link = await prisma.link.findFirst({ where: { id, userId: req.userId } });
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const updatedLink = await prisma.link.update({
      where: { id },
      data: { isFavorite: !link.isFavorite }
    });
    res.json(updatedLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app;
