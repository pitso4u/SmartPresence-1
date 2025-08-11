const { run, query } = require('../db/config');
const { logger } = require('../utils/logger');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/qrcodes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const generateQRCode = async (userId, userType) => {
  try {
    const data = JSON.stringify({ userId, userType, timestamp: new Date().toISOString() });
    const qrCodePath = path.join(uploadsDir, `${userType}_${userId}_${Date.now()}.png`);
    
    await QRCode.toFile(qrCodePath, data, {
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 300,
      margin: 1
    });
    
    return path.relative(path.join(__dirname, '../../'), qrCodePath);
  } catch (error) {
    logger.error('Error generating QR code:', error);
    throw error;
  }
};

const createCard = async (req, res, next) => {
  try {
    const { user_id, user_type, card_image_path } = req.body;
    
    // Generate QR code
    const qrCodePath = await generateQRCode(user_id, user_type);
    
    const sql = 'INSERT INTO cards (user_id, user_type, card_image_path, qr_code_path) VALUES (?, ?, ?, ?)';
    const result = await run(sql, [user_id, user_type, card_image_path, qrCodePath]);
    
    // Get the created card with user details
    const [card] = await query('SELECT * FROM cards WHERE id = ?', [result.lastID]);
    
    res.status(201).json({ 
      status: 'success', 
      data: { 
        ...card,
        qr_code_url: `${process.env.API_BASE_URL || ''}/${qrCodePath.replace(/\\/g, '/')}`
      } 
    });
  } catch (error) {
    logger.error('Error in createCard:', error);
    next(error);
  }
};

const getAllCards = async (req, res, next) => {
  try {
    // Get the most recent card for each user
    const sql = `
      WITH RankedCards AS (
        SELECT 
          *,
          ROW_NUMBER() OVER (PARTITION BY user_id, user_type ORDER BY generated_at DESC) as rn
        FROM cards
      )
      SELECT * FROM RankedCards WHERE rn = 1
    `;
    
    const cards = await query(sql);
    
    // Add full URL to QR code path
    const cardsWithUrls = cards.map(card => ({
      ...card,
      qr_code_url: card.qr_code_path 
        ? `${process.env.API_BASE_URL || ''}/${card.qr_code_path.replace(/\\\\/g, '/')}`
        : null
    }));
    
    res.status(200).json({ 
      status: 'success', 
      data: cardsWithUrls 
    });
  } catch (error) {
    logger.error('Error in getAllCards:', error);
    next(error);
  }
};

const getCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await query('SELECT * FROM cards WHERE id = ?', [id]);
    const card = rows[0];
    if (!card) {
      return res.status(404).json({ status: 'error', message: 'Card not found' });
    }
    res.status(200).json({ status: 'success', data: card });
  } catch (error) {
    logger.error('Error in getCardById:', error);
    next(error);
  }
};

const updateCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, user_type, card_image_path } = req.body;
    
    // Get existing card to check if user_id or user_type changed
    const [existingCard] = await query('SELECT * FROM cards WHERE id = ?', [id]);
    if (!existingCard) {
      return res.status(404).json({ status: 'error', message: 'Card not found' });
    }
    
    // Regenerate QR code if user_id or user_type changed
    let qrCodePath = existingCard.qr_code_path;
    if (user_id !== existingCard.user_id || user_type !== existingCard.user_type) {
      qrCodePath = await generateQRCode(user_id, user_type);
    }
    
    const sql = 'UPDATE cards SET user_id = ?, user_type = ?, card_image_path = ?, qr_code_path = ? WHERE id = ?';
    const result = await run(sql, [user_id, user_type, card_image_path, qrCodePath, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'No changes made' });
    }
    
    // Get the updated card
    const [updatedCard] = await query('SELECT * FROM cards WHERE id = ?', [id]);
    
    res.status(200).json({ 
      status: 'success', 
      data: {
        ...updatedCard,
        qr_code_url: `${process.env.API_BASE_URL || ''}/${qrCodePath.replace(/\\/g, '/')}`
      } 
    });
  } catch (error) {
    logger.error('Error in updateCardById:', error);
    next(error);
  }
};

const deleteCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sql = 'DELETE FROM cards WHERE id = ?';
    await run(sql, [id]);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

const generateCardsForAllUsers = async (req, res, next) => {
  try {
    // Start a transaction
    await query('BEGIN TRANSACTION');
    
    try {
      // Get all students and employees
      const [students, employees] = await Promise.all([
        query('SELECT id FROM students'),
        query('SELECT id FROM employees')
      ]);
      
      const cards = [];
      
      // Generate cards for students
      for (const student of students) {
        try {
          // Check if card already exists
          const existingCard = await query(
            'SELECT * FROM cards WHERE user_id = ? AND user_type = ?', 
            [student.id, 'student']
          );
          
          if (existingCard && existingCard.length > 0) {
            // Skip if card already exists
            cards.push(existingCard[0]);
            continue;
          }
          
          // Generate new QR code
          const qrCodePath = await generateQRCode(student.id, 'student');
          
          // Insert new card with all required fields
          const sql = `
            INSERT INTO cards 
            (user_id, user_type, card_image_path, qr_code_path, generated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;
          
          await query(sql, [
            student.id, 
            'student', 
            null, // card_image_path can be null
            qrCodePath
          ]);
          
          // Get the created card
          const [newCard] = await query(
            'SELECT * FROM cards WHERE user_id = ? AND user_type = ?', 
            [student.id, 'student']
          );
          
          if (newCard) {
            cards.push(newCard);
          }
        } catch (error) {
          logger.error(`Error generating card for student ${student.id}:`, error);
          // Continue with next student even if one fails
        }
      }
      
      // Generate cards for employees
      for (const employee of employees) {
        try {
          // Check if card already exists
          const existingCard = await query(
            'SELECT * FROM cards WHERE user_id = ? AND user_type = ?', 
            [employee.id, 'employee']
          );
          
          if (existingCard && existingCard.length > 0) {
            // Skip if card already exists
            cards.push(existingCard[0]);
            continue;
          }
          
          // Generate new QR code
          const qrCodePath = await generateQRCode(employee.id, 'employee');
          
          // Insert new card with all required fields
          const sql = `
            INSERT INTO cards 
            (user_id, user_type, card_image_path, qr_code_path, generated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;
          
          await query(sql, [
            employee.id, 
            'employee', 
            null, // card_image_path can be null
            qrCodePath
          ]);
          
          // Get the created card
          const [newCard] = await query(
            'SELECT * FROM cards WHERE user_id = ? AND user_type = ?', 
            [employee.id, 'employee']
          );
          
          if (newCard) {
            cards.push(newCard);
          }
        } catch (error) {
          logger.error(`Error generating card for employee ${employee.id}:`, error);
          // Continue with next employee even if one fails
        }
      }
      
      // Commit the transaction
      await query('COMMIT');
      
      res.status(201).json({
        status: 'success',
        data: {
          cards,
          generated: cards.length,
          totalStudents: students.length,
          totalEmployees: employees.length
        }
      });
      
    } catch (error) {
      // Rollback the transaction on error
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    logger.error('Error in generateCardsForAllUsers:', error);
    next(error);
  }
};

module.exports = {
  createCard,
  getAllCards,
  getCardById,
  updateCardById,
  deleteCardById,
  generateCardsForAllUsers
};
