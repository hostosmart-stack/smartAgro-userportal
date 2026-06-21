import React from 'react';
import { Invoice, Boutique, Provenderie } from '../types';

interface InvoiceTemplateProps {
  invoice: Invoice;
  boutique?: Boutique;
  provenderie?: Provenderie;
  companyName?: string;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, boutique, provenderie, companyName }) => {
  if (!invoice) return null;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: 72mm auto; /* Matches your paper width */
            margin: 0; 
          }
          body { 
            margin: 0; 
            padding: 0; 
          }
          .printable-content { 
            width: 72mm !important; 
            /* This padding creates the 'breathing room' from the edges */
            padding: 4mm 2mm !important; 
            margin: 0 auto !important;
            box-sizing: border-box !important;
          }
        }
      `}} />

      <div className="printable-content bg-white text-black font-mono mx-auto" 
           style={{ 
             width: '72mm', 
             padding: '4mm 2mm', // Top/Bottom 4mm, Left/Right 2mm
             fontSize: '11px', 
             lineHeight: '1.2',
             boxSizing: 'border-box'
           }}>
        {/* Header Section */}
      <div className="text-center mb-4 space-y-0.5">
        <h1 className="text-lg font-bold uppercase leading-tight">{provenderie?.name || companyName || 'PROVENDERIE CYRUS'}</h1>
        
        {boutique?.address ? (
          <p className="text-[10px] uppercase font-bold">{boutique.address}</p>
        ) : boutique?.location ? (
          <p className="text-[10px] uppercase font-bold">{boutique.location}</p>
        ) : null}

        {provenderie?.phones && provenderie.phones.length > 0 ? (
          <p className="text-[10px] font-bold">Tél: {provenderie.phones.join(' / ')}</p>
        ) : provenderie?.phone ? (
          <p className="text-[10px] font-bold">Tél: {provenderie.phone}</p>
        ) : null}

        {(provenderie?.legalRC || provenderie?.legalNIU) && (
          <p className="text-[8px] opacity-70 uppercase">
            {provenderie.legalRC && `RC: ${provenderie.legalRC}`}
            {provenderie.legalRC && provenderie.legalNIU && ' - '}
            {provenderie.legalNIU && `NIU: ${provenderie.legalNIU}`}
          </p>
        )}
      </div>

      <div className="border-t border-b border-black border-dashed py-2 mb-4 space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Facture N°:</span>
          <span className="font-bold">#{invoice.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(invoice.date)}</span>
        </div>
        {invoice.sellerName && (
          <div className="flex justify-between">
            <span>Vendeur:</span>
            <span>{invoice.sellerName}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Client:</span>
          <span className="font-bold">{invoice.customerName}</span>
        </div>
        <div className="flex justify-between">
          <span>Statut:</span>
          <span className="font-bold uppercase">{invoice.status}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full text-[9px] table-fixed">
          <thead>
            <tr className="border-b border-black border-dashed">
              <th className="text-left py-1 pl-1 w-[42%]">Désignation</th>
              <th className="text-center py-1 w-[12%]">Qté</th>
              <th className="text-right py-1 w-[22%]">Prix</th>
              <th className="text-right py-1 pr-1 w-[24%]">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-200 border-dashed">
                <td className="py-1 pl-1 pr-1 truncate whitespace-normal break-words align-top">
                  <div className="font-bold leading-tight">{item.name}</div>
                  {item.selectedVariant && (
                    <div className="text-[7px] leading-tight text-gray-600">{item.selectedVariant.name}</div>
                  )}
                </td>
                <td className="py-1 text-center align-top">{item.quantity}</td>
                <td className="py-1 text-right align-top">{formatCurrency(item.price)}</td>
                <td className="py-1 text-right pr-1 font-bold align-top">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary Section */}
      <div className="border-t border-black border-dashed pt-2 space-y-1 text-[10px]">
        <div className="flex justify-between font-bold text-xs">
          <span>Total Net:</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>

        {(invoice.serviceCost || 0) > 0 && (
          <div className="flex justify-between">
            <span>Frais de Service:</span>
            <span>{formatCurrency(invoice.serviceCost || 0)}</span>
          </div>
        )}

        {invoice.advanceUsed > 0 && (
          <div className="flex justify-between">
            <span>Avance Déduite:</span>
            <span>- {formatCurrency(invoice.advanceUsed)}</span>
          </div>
        )}

        <div className="flex justify-between border-t border-gray-300 border-dashed pt-1 mt-1">
          <span>Montant Versé:</span>
          <span className="font-bold">{formatCurrency(invoice.amountPaid)}</span>
        </div>

        {invoice.reimbursement > 0 && (
          <div className="flex justify-between">
            <span>Monnaie Rendue:</span>
            <span>{formatCurrency(invoice.reimbursement)}</span>
          </div>
        )}

        {invoice.newAdvanceCreated > 0 && (
          <div className="flex justify-between">
            <span>Nouvelle Avance:</span>
            <span>+ {formatCurrency(invoice.newAdvanceCreated)}</span>
          </div>
        )}

        {invoice.remainingDebt > 0 && (
          <div className="flex justify-between">
            <span>Reste à Payer:</span>
            <span className="font-bold">{formatCurrency(invoice.remainingDebt)}</span>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-6 pt-2 border-t border-black border-dashed text-center space-y-2 text-[10px]">
        <p className="font-bold uppercase">Merci de votre visite !</p>
        <p className="text-[8px]">Les marchandises vendues ne sont ni reprises ni échangées.</p>
        <p className="text-[8px] italic">Smart Agro</p>
      </div>
      </div>
    </>
  );
};
