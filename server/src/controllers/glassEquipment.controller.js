const { prisma } = require('../services/database');

// ============ GLASS TYPES CONTROLLER ============

const getAllGlassTypes = async (req, res, next) => {
  try {
    const glassTypes = await prisma.glassType.findMany({
      include: {
        _count: {
          select: { drinks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ glassTypes });
  } catch (error) {
    next(error);
  }
};

const getGlassTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const glassType = await prisma.glassType.findUnique({
      where: { id },
      include: {
        drinks: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!glassType) {
      return res.status(404).json({ error: 'Glass type not found' });
    }

    res.json({ glassType });
  } catch (error) {
    next(error);
  }
};

const createGlassType = async (req, res, next) => {
  try {
    const { name, description, imageUrl, capacity } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const glassType = await prisma.glassType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        capacity: capacity || null,
      },
    });

    res.status(201).json({
      message: 'Glass type created successfully',
      glassType,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A glass type with this name already exists',
      });
    }
    next(error);
  }
};

const updateGlassType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, capacity } = req.body;

    const glassType = await prisma.glassType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(capacity !== undefined && { capacity }),
      },
    });

    res.json({
      message: 'Glass type updated successfully',
      glassType,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Glass type not found' });
    }
    next(error);
  }
};

const deleteGlassType = async (req, res, next) => {
  try {
    const { id } = req.params;

    const glassType = await prisma.glassType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { drinks: true },
        },
      },
    });

    if (!glassType) {
      return res.status(404).json({ error: 'Glass type not found' });
    }

    if (glassType._count.drinks > 0) {
      return res.status(409).json({
        error: 'Cannot delete glass type that is used in drinks',
        details: { drinks: glassType._count.drinks },
      });
    }

    await prisma.glassType.delete({ where: { id } });

    res.json({ message: 'Glass type deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ============ EQUIPMENT CONTROLLER ============

const getAllEquipment = async (req, res, next) => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        _count: {
          select: { drinks: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ equipment });
  } catch (error) {
    next(error);
  }
};

const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        drinks: {
          include: {
            drink: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ equipment });
  } catch (error) {
    next(error);
  }
};

const createEquipment = async (req, res, next) => {
  try {
    const { name, description, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      },
    });

    res.status(201).json({
      message: 'Equipment created successfully',
      equipment,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Equipment with this name already exists',
      });
    }
    next(error);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl } = req.body;

    const equipment = await prisma.equipment.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
      },
    });

    res.json({
      message: 'Equipment updated successfully',
      equipment,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    next(error);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { drinks: true },
        },
      },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    if (equipment._count.drinks > 0) {
      return res.status(409).json({
        error: 'Cannot delete equipment that is used in drinks',
        details: { drinks: equipment._count.drinks },
      });
    }

    await prisma.equipment.delete({ where: { id } });

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Glass Types
  getAllGlassTypes,
  getGlassTypeById,
  createGlassType,
  updateGlassType,
  deleteGlassType,
  
  // Equipment
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};