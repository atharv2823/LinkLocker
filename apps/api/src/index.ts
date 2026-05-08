import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running smoothly with Prisma & MongoDB!' });
});

// Categories
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    res.status(500).json({ error: 'Failed to fetch categories', details: String(error) });
  }
});

app.post('/api/categories', async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  try {
    const newCat = await prisma.category.create({
      data: { name }
    });
    res.status(201).json(newCat);
  } catch (error) {
    console.error("POST /api/categories error:", error);
    res.status(500).json({ error: 'Failed to create category', details: String(error) });
  }
});

// Links
app.get('/api/links', async (req: Request, res: Response) => {
  try {
    const links = await prisma.link.findMany({
      orderBy: { id: 'desc' } // Return newest first
    });
    res.json(links);
  } catch (error) {
    console.error("GET /api/links error:", error);
    res.status(500).json({ error: 'Failed to fetch links', details: String(error) });
  }
});

app.post('/api/links', async (req: Request, res: Response) => {
  const { url, title, description, categoryId } = req.body;
  if (!url || !title) return res.status(400).json({ error: 'URL and title are required' });
  if (!categoryId) return res.status(400).json({ error: 'Category is required' });
  
  try {
    const newLink = await prisma.link.create({
      data: {
        url,
        title,
        description: description || "",
        categoryId,
        dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isFavorite: false
      }
    });
    res.status(201).json(newLink);
  } catch (error) {
    console.error("POST /api/links error:", error);
    res.status(500).json({ error: 'Failed to create link', details: String(error) });
  }
});

app.delete('/api/links/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.link.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/links error:", error);
    res.status(500).json({ error: 'Failed to delete link', details: String(error) });
  }
});

app.patch('/api/links/:id/favorite', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const link = await prisma.link.findUnique({ where: { id } });
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const updatedLink = await prisma.link.update({
      where: { id },
      data: { isFavorite: !link.isFavorite }
    });
    res.json(updatedLink);
  } catch (error) {
    console.error("PATCH /api/links error:", error);
    res.status(500).json({ error: 'Failed to toggle favorite', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
