import { Injectable, signal, inject } from '@angular/core';
import { NegotiationThread, ChatMessage, PriceOffer, Listing } from '../models/marketplace.model';
import { OrderService } from './order.service';

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private orderService = inject(OrderService);

  // Pure authentic user negotiations (Zero Fake Data Policy)
  threads = signal<NegotiationThread[]>([]);
  activeThreadId = signal<string>('');

  activeThread = () => {
    const id = this.activeThreadId();
    return this.threads().find(t => t.id === id) || this.threads()[0];
  };

  selectThread(id: string): void {
    this.activeThreadId.set(id);
    this.threads.update(items =>
      items.map(t => t.id === id ? { ...t, unreadCount: 0 } : t)
    );
  }

  startNegotiationWithListing(listing: Listing, buyerName: string): string {
    const existing = this.threads().find(t => t.listingId === listing.id);
    if (existing) {
      this.selectThread(existing.id);
      return existing.id;
    }

    const newId = `NEG-${Math.floor(304 + Math.random() * 600)}`;
    const newThread: NegotiationThread = {
      id: newId,
      listingId: listing.id,
      counterpartyName: listing.farmerName,
      counterpartyRole: 'Seller',
      cropType: listing.cropType,
      quantityTons: listing.quantityTons,
      askingPricePerTon: listing.pricePerTon,
      status: 'active',
      lastMessage: 'Inquiry started',
      lastUpdated: 'Just now',
      unreadCount: 0,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          sender: 'me',
          senderName: buyerName,
          text: `Inquiring about listing ${listing.id} (${listing.cropType}, ${listing.quantityTons} Tons at ₹${listing.pricePerTon}/Ton in ${listing.district}).`,
          timestamp: 'Just now'
        }
      ]
    };

    this.threads.update(prev => [newThread, ...prev]);
    this.selectThread(newId);
    return newId;
  }

  sendMessage(text: string, senderName: string, meta?: { detectedLanguage?: string; originalLanguage?: string; translations?: Record<string, string> }): void {
    const currentId = this.activeThreadId();
    if (!currentId || !text.trim()) return;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'me',
      senderName,
      text: text.trim(),
      timestamp: 'Just now',
      detectedLanguage: meta?.detectedLanguage,
      originalLanguage: meta?.originalLanguage || meta?.detectedLanguage,
      translations: meta?.translations
    };

    this.threads.update(items =>
      items.map(t => {
        if (t.id === currentId) {
          return {
            ...t,
            lastMessage: text.trim(),
            lastUpdated: 'Just now',
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );
  }

  updateMessageTranslations(messageId: string, detected: string, translations: Record<string, string>): void {
    const currentId = this.activeThreadId();
    if (!currentId) return;
    this.threads.update(items =>
      items.map(t => {
        if (t.id === currentId) {
          return {
            ...t,
            messages: t.messages.map(m => m.id === messageId ? {
              ...m,
              detectedLanguage: detected,
              originalLanguage: m.originalLanguage || detected,
              translations: { ...(m.translations || {}), ...translations }
            } : m)
          };
        }
        return t;
      })
    );
  }

  sendOffer(offeredPricePerTon: number, quantityTons: number, note?: string): void {
    this.sendCounterOffer(offeredPricePerTon, quantityTons, note);
  }

  sendCounterOffer(offeredPricePerTon: number, quantityTons: number, note?: string): void {
    const currentId = this.activeThreadId();
    if (!currentId) return;

    const offer: PriceOffer = {
      id: `OFF-${Date.now()}`,
      sender: 'seller',
      offeredPricePerTon,
      quantityTons,
      totalAmount: offeredPricePerTon * quantityTons,
      status: 'pending',
      timestamp: 'Just now',
      note
    };

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'me',
      senderName: 'Seller Counter-Offer',
      text: `Counter-offer: ₹${offeredPricePerTon.toLocaleString('en-IN')}/Ton for ${quantityTons} Tonnes.${note ? ' Note: ' + note : ''}`,
      timestamp: 'Just now',
      offer
    };

    this.threads.update(items =>
      items.map(t => {
        if (t.id === currentId) {
          return {
            ...t,
            lastMessage: `Counter-offer: ₹${offeredPricePerTon}/Ton`,
            lastUpdated: 'Just now',
            messages: [...t.messages, newMsg]
          };
        }
        return t;
      })
    );
  }

  acceptOffer(messageId: string): void {
    const currentId = this.activeThreadId();
    const thread = this.threads().find(t => t.id === currentId);
    if (!thread) return;

    let acceptedOffer: PriceOffer | undefined;

    this.threads.update(items =>
      items.map(t => {
        if (t.id === currentId) {
          const updatedMessages = t.messages.map(m => {
            if (m.id === messageId && m.offer) {
              acceptedOffer = { ...m.offer, status: 'accepted' };
              return { ...m, offer: acceptedOffer };
            }
            return m;
          });

          return {
            ...t,
            status: 'accepted',
            lastMessage: `Offer accepted at ₹${acceptedOffer?.offeredPricePerTon || t.askingPricePerTon}/Ton`,
            lastUpdated: 'Just now',
            messages: [
              ...updatedMessages,
              {
                id: `MSG-${Date.now()}`,
                sender: 'me',
                senderName: 'System',
                text: 'Deal confirmed! Both parties have accepted the offer terms. An order has been generated automatically in Orders.',
                timestamp: 'Just now'
              }
            ]
          };
        }
        return t;
      })
    );

    if (acceptedOffer) {
      this.orderService.createOrder({
        buyerName: 'Procurement Buyer',
        sellerName: thread.counterpartyName,
        cropType: thread.cropType,
        quantityTons: acceptedOffer.quantityTons,
        pricePerTon: acceptedOffer.offeredPricePerTon,
        totalAmount: acceptedOffer.totalAmount,
        status: 'Order Placed',
        originLocation: `${thread.counterpartyName} Farm Hub`,
        deliveryLocation: 'Buyer Processing Facility',
        truckDetails: 'Assigned upon driver dispatch',
        estimatedDelivery: '3 Days from Booking'
      });
    }
  }

  declineOffer(messageId: string): void {
    const currentId = this.activeThreadId();
    this.threads.update(items =>
      items.map(t => {
        if (t.id === currentId) {
          const updatedMessages = t.messages.map(m => {
            if (m.id === messageId && m.offer) {
              return { ...m, offer: { ...m.offer, status: 'declined' as const } };
            }
            return m;
          });

          return {
            ...t,
            lastMessage: 'Offer declined',
            lastUpdated: 'Just now',
            messages: [
              ...updatedMessages,
              {
                id: `MSG-${Date.now()}`,
                sender: 'me',
                senderName: 'System',
                text: 'Offer declined. You can submit an alternative counter-offer.',
                timestamp: 'Just now'
              }
            ]
          };
        }
        return t;
      })
    );
  }
}
