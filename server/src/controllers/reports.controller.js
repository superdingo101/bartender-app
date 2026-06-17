const { prisma } = require('../services/database');

const getPersonKey = (order) => order.customer?.id || order.customerName || 'Guest';

const getPersonName = (order) => order.customer?.name || order.customerName || 'Guest';

const incrementMetric = (map, key, defaults, updater) => {
  if (!map.has(key)) {
    map.set(key, { ...defaults });
  }
  updater(map.get(key));
};

const getIngredientUnitCost = (ingredient, reportDate) => {
  const cutoffDate = reportDate ? new Date(reportDate) : null;
  const matchingPurchases = ingredient.purchaseHistory.filter(
    (purchase) => purchase.unit === ingredient.unit
      && purchase.quantity > 0
      && (!cutoffDate || new Date(purchase.purchaseDate) <= cutoffDate),
  );

  if (matchingPurchases.length > 0) {
    const totalPrice = matchingPurchases.reduce((sum, purchase) => sum + purchase.price, 0);
    const totalQuantity = matchingPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    return totalQuantity > 0 ? totalPrice / totalQuantity : null;
  }

  if (ingredient.bottlePrice && ingredient.quantity > 0) {
    return ingredient.bottlePrice / ingredient.quantity;
  }

  return null;
};

const getReportingStats = async (req, res, next) => {
  try {
    const { eventId } = req.query;

    const where = {
      ...(eventId && { eventId }),
      status: { not: 'CANCELLED' },
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        claimedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        drink: {
          include: {
            ingredients: {
              include: {
                ingredient: {
                  include: {
                    purchaseHistory: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const event = eventId
      ? await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, name: true, date: true, location: true },
      })
      : null;

    const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
    const drinkTotals = new Map();
    const ingredientTotals = new Map();
    const customerOrderTotals = new Map();
    const personDrinkTotals = new Map();
    const bartenderDrinkTotals = new Map();

    completedOrders.forEach((order) => {
      incrementMetric(
        drinkTotals,
        order.drink.id,
        { drinkId: order.drink.id, drinkName: order.drink.name, quantity: 0, orderCount: 0 },
        (metric) => {
          metric.quantity += order.quantity;
          metric.orderCount += 1;
        },
      );

      order.drink.ingredients.forEach((drinkIngredient) => {
        const ingredient = drinkIngredient.ingredient;
        const quantity = drinkIngredient.quantity * order.quantity;
        const unitCost = getIngredientUnitCost(ingredient, order.event?.date || order.createdAt);
        incrementMetric(
          ingredientTotals,
          `${ingredient.id}:${drinkIngredient.unit}`,
          {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            unit: drinkIngredient.unit,
            quantity: 0,
            estimatedCost: 0,
            hasCost: false,
          },
          (metric) => {
            metric.quantity += quantity;
            if (unitCost !== null && drinkIngredient.unit === ingredient.unit) {
              metric.estimatedCost += quantity * unitCost;
              metric.hasCost = true;
            }
          },
        );
      });

      if (order.claimedBy) {
        incrementMetric(
          bartenderDrinkTotals,
          order.claimedBy.id,
          { bartenderId: order.claimedBy.id, bartenderName: order.claimedBy.name, drinkCount: 0, orderCount: 0 },
          (metric) => {
            metric.drinkCount += order.quantity;
            metric.orderCount += 1;
          },
        );
      }
    });

    orders.forEach((order) => {
      const personKey = getPersonKey(order);
      const personDefaults = {
        customerId: order.customer?.id || null,
        customerName: getPersonName(order),
        email: order.customer?.email || null,
        orderCount: 0,
      };
      incrementMetric(customerOrderTotals, personKey, personDefaults, (metric) => {
        metric.orderCount += 1;
      });

      incrementMetric(
        personDrinkTotals,
        personKey,
        { ...personDefaults, drinkCount: 0 },
        (metric) => {
          metric.drinkCount += order.quantity;
        },
      );
    });

    const ingredientUsage = Array.from(ingredientTotals.values());
    const totalIngredientCost = ingredientUsage.reduce(
      (sum, ingredient) => sum + ingredient.estimatedCost,
      0,
    );

    res.json({
      scope: event ? 'event' : 'all-time',
      event,
      totals: {
        orders: orders.length,
        completedOrders: completedOrders.length,
        drinksMade: completedOrders.reduce((sum, order) => sum + order.quantity, 0),
        totalIngredientCost,
      },
      drinksMade: Array.from(drinkTotals.values()).sort((a, b) => b.quantity - a.quantity),
      ingredientUsage: ingredientUsage.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName)),
      customerOrders: Array.from(customerOrderTotals.values()).sort((a, b) => b.orderCount - a.orderCount),
      personDrinks: Array.from(personDrinkTotals.values()).sort((a, b) => b.drinkCount - a.drinkCount),
      bartenderDrinks: Array.from(bartenderDrinkTotals.values()).sort((a, b) => b.drinkCount - a.drinkCount),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportingStats,
};
