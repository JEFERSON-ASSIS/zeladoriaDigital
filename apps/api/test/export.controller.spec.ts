import { ExportController } from '../src/modules/export/export.controller';

describe('ExportController', () => {
  it('sets download headers and sends payload', async () => {
    const service = {
      exportGrid: jest.fn().mockResolvedValue({
        contentType: 'text/csv',
        filename: 'export.csv',
        body: 'a,b,c'
      })
    };

    const controller = new ExportController(service as any);
    const res = {
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis()
    } as any;

    await controller.export({ format: 'csv', filters: { status: 'ABERTO' } }, res);

    expect(service.exportGrid).toHaveBeenCalledWith('csv', { status: 'ABERTO' });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="export.csv"');
    expect(res.send).toHaveBeenCalledWith('a,b,c');
  });
});
