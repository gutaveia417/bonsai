assert.grupo('datas', function () {
  assert.eq(Bonsai.datas.somarDias('2026-09-01', 32), '2026-10-03', 'soma atravessa o mês');
  assert.eq(Bonsai.datas.somarDias('2026-12-31', 1), '2027-01-01', 'soma atravessa o ano');
  assert.eq(Bonsai.datas.diasEntre('2026-09-01', '2026-09-05'), 4, 'diferença simples');
  assert.eq(Bonsai.datas.diasEntre('2026-09-05', '2026-09-01'), -4, 'diferença negativa');
  assert.eq(Bonsai.datas.mes('2026-09-05'), 9, 'mês é 1-12');
  assert.eq(Bonsai.datas.formatarBR('2026-09-05'), '05/09/2026', 'formato BR');
  assert.eq(Bonsai.datas.valida('2026-13-01'), false, 'mês 13 é inválido');
  assert.eq(Bonsai.datas.valida('2026-02-30'), false, '30 de fevereiro é inválido');
  assert.eq(Bonsai.datas.valida('2026-09-05'), true, 'data boa');
});
