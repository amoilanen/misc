import React, { useState, useRef } from 'react';
import {
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { DateFormat } from '../types';

interface ImportResult {
  imported: number;
  skipped: number;
  skippedMissingDate: number;
  errors: string[];
}

const ImportEvents: React.FC = () => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateColumn, setDateColumn] = useState('');
  const [amountColumn, setAmountColumn] = useState('');
  const [descriptionColumn, setDescriptionColumn] = useState('');
  const [dateFormat, setDateFormat] = useState<DateFormat>(DateFormat.DD_MM_YYYY);
  const [delimiter, setDelimiter] = useState(';');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      // Read headers from CSV
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split('\n')[0];
        const headers = firstLine.split(delimiter);
        setHeaders(headers);
      };
      reader.readAsText(selectedFile);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dateColumn', dateColumn);
    formData.append('amountColumn', amountColumn);
    formData.append('descriptionColumn', descriptionColumn);
    formData.append('dateFormat', dateFormat);
    formData.append('delimiter', delimiter);

    try {
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResult(result);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        imported: 0,
        skipped: 0,
        skippedMissingDate: 0,
        errors: ['Failed to import events. Please try again.'],
      });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              backgroundColor: 'action.hover',
              cursor: 'pointer',
              mb: 2,
              minWidth: '100%',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            {file ? (
              <Typography variant="body1" color="primary">
                Selected file: {file.name}
              </Typography>
            ) : (
              <Typography variant="body1" color="textSecondary">
                Click to select a CSV file or drag and drop
              </Typography>
            )}
          </Box>
        </Box>

        <Box>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 1,
              p: 3,
              boxShadow: 1,
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              CSV Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel id="date-column-label">Date Column</InputLabel>
                  <Select
                    labelId="date-column-label"
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    label="Date Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel id="amount-column-label">Amount Column</InputLabel>
                  <Select
                    labelId="amount-column-label"
                    value={amountColumn}
                    onChange={(e) => setAmountColumn(e.target.value)}
                    label="Amount Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel id="description-column-label">Description Column</InputLabel>
                  <Select
                    labelId="description-column-label"
                    value={descriptionColumn}
                    onChange={(e) => setDescriptionColumn(e.target.value)}
                    label="Description Column"
                    size="medium"
                  >
                    {headers.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel id="date-format-label">Date Format</InputLabel>
                  <Select
                    labelId="date-format-label"
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value as DateFormat)}
                    label="Date Format"
                    size="medium"
                  >
                    <MenuItem value={DateFormat.DD_MM_YYYY}>DD/MM/YYYY</MenuItem>
                    <MenuItem value={DateFormat.MM_DD_YYYY}>MM/DD/YYYY</MenuItem>
                    <MenuItem value={DateFormat.YYYY_MM_DD}>YYYY/MM/DD</MenuItem>
                    <MenuItem value={DateFormat.DD_MM_YY}>DD/MM/YY</MenuItem>
                    <MenuItem value={DateFormat.MM_DD_YY}>MM/DD/YY</MenuItem>
                    <MenuItem value={DateFormat.YY_MM_DD}>YY/MM/DD</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel id="delimiter-label">Delimiter</InputLabel>
                  <Select
                    labelId="delimiter-label"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    label="Delimiter"
                    size="medium"
                  >
                    <MenuItem value=",">,</MenuItem>
                    <MenuItem value=";">;</MenuItem>
                    <MenuItem value="|">|</MenuItem>
                    <MenuItem value="\t">Tab</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!file || !dateColumn || !amountColumn || !descriptionColumn}
            fullWidth
          >
            Import Events
          </Button>
        </Box>
      </Box>

      {importResult && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={importResult.errors.length > 0 ? 'error' : 'success'}>
            <AlertTitle>
              {importResult.errors.length > 0 ? 'Import Failed' : 'Import Successful'}
            </AlertTitle>
            <Typography variant="body2">
              Imported: {importResult.imported} events
              {importResult.skipped > 0 && (
                <>
                  <br />
                  Skipped: {importResult.skipped} events
                </>
              )}
              {importResult.skippedMissingDate > 0 && (
                <>
                  <br />
                  Skipped (missing date): {importResult.skippedMissingDate} events
                </>
              )}
              {importResult.errors.length > 0 && (
                <>
                  <br />
                  Errors:
                  <ul>
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </>
              )}
            </Typography>
          </Alert>
        </Box>
      )}
    </form>
  );
};

export default ImportEvents; 