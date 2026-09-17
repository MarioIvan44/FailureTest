import nodemailer from "nodemailer";
import Settings from "../models/Settings.js";

const DEFAULT_ADMIN_EMAIL = "noreply.exequiel.miranda@gmail.com";

// Configurar el transporter de Gmail
const createTransporter = () => {
  const userEmail = process.env.GMAIL_USER;
  const userPass = process.env.GMAIL_APP_PASSWORD;

  if (!userEmail || !userPass) {
    throw new Error(
      "GMAIL_USER y GMAIL_APP_PASSWORD deben estar configurados en las variables de entorno"
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: userEmail,
      pass: userPass,
    },
  });
};

/**
 * Genera el contenido HTML del email según el tipo
 */
const generateEmailContent = (email, code, type) => {
  const baseHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">{TITLE}</h2>
        <p style="color: #666; line-height: 1.6;">
          {MESSAGE}
        </p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Código de verificación:</p>
          <h1 style="margin: 10px 0; font-size: 32px; color: #f875aa; letter-spacing: 5px; font-family: monospace;">${code}</h1>
        </div>
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          Este código expirará en 15 minutos. Si no solicitaste este código, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `;

  if (type === "registration") {
    return {
      subject: "Código de Verificación para Registro de Usuario",
      html: baseHtml
        .replace("{TITLE}", "Código de Verificación para Registro")
        .replace(
          "{MESSAGE}",
          `Se ha solicitado registrar un nuevo usuario con el correo: <strong>${email}</strong>`
        ),
    };
  } else if (type === "password_reset") {
    return {
      subject: "Código de Verificación para Recuperación de Contraseña",
      html: baseHtml
        .replace("{TITLE}", "Recuperación de Contraseña")
        .replace(
          "{MESSAGE}",
          "Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:"
        ),
    };
  } else if (type === "account_verification") {
    return {
      subject: "Verifica tu cuenta - Código de seguridad",
      html: baseHtml
        .replace("{TITLE}", "Verifica tu cuenta")
        .replace(
          "{MESSAGE}",
          "Gracias por registrarte. Para completar la creación de tu cuenta y confirmar que este correo te pertenece, ingresa el siguiente código de verificación:"
        ),
    };
  } else if (type === "order_status_update") {
    return {
      subject: `Actualización de pedido #${code.orderNumber}`,
      html: baseHtml
        .replace("{TITLE}", "Actualización de tu Pedido")
        .replace(
          "{MESSAGE}",
          code.message
        )
        // Remove code section for general notifications
        .replace(
          /<div style="background-color: #f8f9fa;.*<\/div>/s,
          ""
        ),
    };
  } else {
    throw new Error("Tipo de correo no válido");
  }
};

/**
 * Obtiene el email de admin configurado o el default
 */
const getAdminEmail = async () => {
  try {
    const setting = await Settings.findOne({ key: 'adminEmail' });
    return setting ? setting.value : DEFAULT_ADMIN_EMAIL;
  } catch (error) {
    console.error('Error fetching admin email setting:', error);
    return DEFAULT_ADMIN_EMAIL;
  }
};

/**
 * Envía un código de verificación por email usando Nodemailer con Gmail SMTP
 * @param {string} email - Email del destinatario
 * @param {string} code - Código de verificación
 * @param {string} type - Tipo de correo: "registration" o "password_reset"
 */
export const sendVerificationCode = async (email, code, type) => {
  try {
    // Crear transporter
    const transporter = createTransporter();

    // Obtener configuración del remitente
    const senderEmail = process.env.GMAIL_USER;
    const senderName = process.env.GMAIL_SENDER_NAME || "Sistema de Inventario";

    if (!senderEmail) {
      throw new Error(
        "GMAIL_USER no está configurada en las variables de entorno"
      );
    }

    // Determinar destinatario
    let toEmail = email;
    if (type === "registration") {
      toEmail = await getAdminEmail();
    }
    // For account_verification, toEmail remains the user's email

    // Generar contenido del email
    const { subject, html } = generateEmailContent(email, code, type);

    // Enviar correo
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      html: html,
    });

    console.log("Correo enviado exitosamente con Gmail:", {
      to: toEmail,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId || "unknown",
      provider: "gmail",
    };
  } catch (error) {
    console.error("Error completo al enviar correo:", error);

    if (
      error.message.includes("no está configurada") ||
      error.message.includes("deben estar configurados")
    ) {
      throw new Error(
        `Configuración incompleta.Verifica las variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD.`
      );
    }

    if (error.code === "EAUTH") {
      throw new Error(
        `Error de autenticación con Gmail.Verifica que GMAIL_APP_PASSWORD sea correcta. ` +
        `Debe ser una contraseña de aplicación, no tu contraseña normal de Gmail. ` +
        `Obtén una en: https://myaccount.google.com/apppasswords`
      );
    }

    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      throw new Error(
        `Error de conexión con Gmail. Verifica tu conexión a internet.`
      );
    }

    throw new Error(
      `Error al enviar el correo electrónico: ${error.message || "Error desconocido"
      }`
    );
  }
};

/**
 * Envía un correo de actualización de estado de pedido
 * @param {string} email - Email del destinatario (cliente)
 * @param {Object} order - Objeto del pedido
 * @param {string} status - Nuevo estado
 */
export const sendOrderStatusUpdate = async (email, order, status) => {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.GMAIL_USER;
    const senderName = process.env.GMAIL_SENDER_NAME || "Sistema de Inventario";

    const statusMessages = {
      'pending': 'Tu pedido ha sido recibido y está pendiente.',
      'processing': 'Tu pedido está siendo procesado.',
      'shipped': '¡Tu pedido ha sido enviado!',
      'delivered': 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      'cancelled': 'Tu pedido ha sido cancelado.',
      'completed': 'Tu pedido ha sido completado.'
    };

    const friendlyStatus = statusMessages[status] || `El estado de tu pedido ha cambiado a: ${status}`;

    const orderDate = new Date(order.createdAt).toLocaleDateString();

    const message = `
      <p>Hola <strong>${order.customer?.fullName || 'Cliente'}</strong>,</p>
      <p>${friendlyStatus}</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
        <p style="margin: 5px 0;"><strong>Pedido:</strong> #${order.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${orderDate}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> $${Number(order.total).toFixed(2)}</p>
      </div>
      <p>Puedes ver los detalles de tu pedido en tu perfil.</p>
    `;

    // Reusing the generic generator but passing an object as 'code' for flexibility
    const { subject, html } = generateEmailContent(email, { message, orderNumber: order.orderNumber }, "order_status_update");

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: email,
      subject: subject,
      html: html,
    });

    console.log(`Correo de estado de pedido enviado a: ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo de estado de pedido:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Envía una alerta de stock crítico al administrador
 * @param {Object} product - Producto con stock crítico
 * @param {number} criticalStockLevel - Nivel de stock crítico configurado
 */
export const sendCriticalStockAlert = async (product, criticalStockLevel) => {
  try {
    const transporter = createTransporter();
    const adminEmail = await getAdminEmail();
    const senderEmail = process.env.GMAIL_USER;
    const senderName = process.env.GMAIL_SENDER_NAME || "Sistema de Inventario";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #d32f2f; margin-top: 0;">⚠️ Alerta de Stock Crítico</h2>
          <p style="color: #666; line-height: 1.6;">
            El siguiente producto ha alcanzado el nivel de stock crítico:
          </p>
          <div style="background-color: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Producto:</strong> ${product.name}</p>
            <p style="margin: 5px 0;"><strong>Stock actual:</strong> ${product.stock} unidades</p>
            <p style="margin: 5px 0;"><strong>Nivel crítico:</strong> ${criticalStockLevel} unidades</p>
            ${product.barcode ? `<p style="margin: 5px 0;"><strong>Código de barras:</strong> ${product.barcode}</p>` : ''}
            ${product.location ? `<p style="margin: 5px 0;"><strong>Ubicación:</strong> ${product.location}</p>` : ''}
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Se recomienda reabastecer este producto lo antes posible.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: adminEmail,
      subject: `⚠️ Stock Crítico: ${product.name}`,
      html: html,
    });

    console.log(`Alerta de stock crítico enviada para producto: ${product.name}`);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar alerta de stock crítico:', error);
    // No lanzamos error para no interrumpir el flujo principal
    return { success: false, error: error.message };
  }
};

/**
 * Envía una alerta cuando un producto se agota completamente
 * @param {Object} product - Producto agotado
 */
export const sendOutOfStockAlert = async (product) => {
  try {
    const transporter = createTransporter();
    const adminEmail = await getAdminEmail();
    const senderEmail = process.env.GMAIL_USER;
    const senderName = process.env.GMAIL_SENDER_NAME || "Sistema de Inventario";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #d32f2f; margin-top: 0;">🚫 Producto Agotado</h2>
          <p style="color: #666; line-height: 1.6;">
            El siguiente producto se ha agotado completamente:
          </p>
          <div style="background-color: #ffebee; padding: 20px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Producto:</strong> ${product.name}</p>
            <p style="margin: 5px 0;"><strong>Stock actual:</strong> 0 unidades</p>
            ${product.barcode ? `<p style="margin: 5px 0;"><strong>Código de barras:</strong> ${product.barcode}</p>` : ''}
            ${product.location ? `<p style="margin: 5px 0;"><strong>Ubicación:</strong> ${product.location}</p>` : ''}
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Es necesario reabastecer este producto para continuar con las ventas.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: adminEmail,
      subject: `🚫 Producto Agotado: ${product.name}`,
      html: html,
    });

    console.log(`Alerta de producto agotado enviada para: ${product.name}`);
    return { success: true };
  } catch (error) {
    console.error('Error al enviar alerta de producto agotado:', error);
    return { success: false, error: error.message };
  }
};
