import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, Clipboard } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const CredentialsDisplayModal = ({ isOpen, onClose, credentials, entityName }) => {
    const { success } = useNotification();

    if (!isOpen) return null;

    const handleDownloadCSV = () => {
        if (!credentials || credentials.length === 0) return;
        
        const headers = Object.keys(credentials[0]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

        credentials.forEach(cred => {
            const row = headers.map(header => `"${cred[header]}"`).join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${entityName.toLowerCase()}_credentials.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyToClipboard = () => {
        if (!credentials || credentials.length === 0) return;

        const headers = Object.keys(credentials[0]);
        let textContent = headers.join("\t") + "\n";

        credentials.forEach(cred => {
            const row = headers.map(header => cred[header]).join("\t");
            textContent += row + "\n";
        });
        
        navigator.clipboard.writeText(textContent).then(() => {
            success('Credentials copied to clipboard!');
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                <div className="p-4 border-b border-[var(--border,#DCEBF2)] flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--text-primary,#183040)]">{entityName} Credentials</h2>
                    <button onClick={onClose} className="text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)]">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-end gap-2 mb-4">
                        <button 
                            onClick={handleCopyToClipboard}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary,#183040)] bg-[var(--background,#F4FAFD)] border border-[var(--border,#DCEBF2)] rounded-lg hover:bg-slate-100"
                        >
                            <Clipboard size={16} /> Copy
                        </button>
                        <button 
                            onClick={handleDownloadCSV}
                            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                        >
                            <Download size={16} /> Download CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto border border-[var(--border,#DCEBF2)] rounded-xl">
                        <table className="min-w-full divide-y divide-[var(--border,#DCEBF2)]">
                            <thead className="bg-[var(--background,#F4FAFD)]">
                                <tr>
                                    {credentials.length > 0 && Object.keys(credentials[0]).map(key => (
                                        <th key={key} className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary,#486273)] uppercase tracking-wider">
                                            {key.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-[var(--surface,#FFFFFF)] divide-y divide-[var(--border,#DCEBF2)]">
                                {credentials.map((cred, index) => (
                                    <tr key={index}>
                                        {Object.values(cred).map((value, i) => (
                                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary,#183040)]">
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default CredentialsDisplayModal; 