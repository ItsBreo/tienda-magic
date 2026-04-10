<?php

namespace App\Mail;

use App\Models\Order;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public Order $order;
    public User $user;
    public $items;

    /**
     * Create a new message instance.
     */
    public function __construct(Order $order, User $user, $items)
    {
        $this->order = $order;
        $this->user = $user;
        $this->items = $items;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tu Factura de Tienda Magic - Orden #' . str_pad($this->order->id, 6, '0', STR_PAD_LEFT),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice_mail',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        // Generar el PDF en memoria
        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $this->order,
            'user' => $this->user,
            'items' => $this->items,
        ]);

        return [
            Attachment::fromData(fn () => $pdf->output(), 'Factura-FAC-' . str_pad($this->order->id, 6, '0', STR_PAD_LEFT) . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
