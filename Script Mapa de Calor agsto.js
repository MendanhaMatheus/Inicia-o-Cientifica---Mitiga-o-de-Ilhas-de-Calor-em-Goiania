//Semana 3: Landsat 8 Goiania GO
//IC: Mitigação de ilhas de calor em Goiania

var ano = 2023;
var dataInicio = ano + '-08-01';
var dataFim = ano + '-08-31';

//goiania
var pontoGoiania = ee.Geometry.Point([-49.255, -16.679]);
var goiania = pontoGoiania.buffer(25000);
Map.centerObject(pontoGoiania, 11);

//funcao de escala e converter pra celsius
function processarLST(image) 
{
  var thermalBand = image.select('ST_B10')
  .multiply(0.00341802)
  .add(149.0)
  .subtract(273.15)
  .rename('LST_C');
  return image.addBands(thermalBand, null, true);
}

//puxar colecao de agosto
var colecaoAgosto = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
.filterBounds(goiania)
.filterDate(dataInicio, dataFim);
print("DIAGNOSTICO AGOSTO " + ano)
print("Total de passagens do Landsat 8 em Agosto:", colecaoAgosto.size());

//Listar datas e percentuais de nuvem
var infoCenas = colecaoAgosto.map(function(img) 
{
  return ee.Feature(null,{
    'ID': img.id(),
    'Data': img.date().format('YYYY-MM-dd'),
    'Nuvem_Percentual': img.get('CLOUD_COVER')
  });
});
print("Detalhes de cada cena (Data e % de Nuvens):", infoCenas);

//filtrar a imagem com a menor cobertura de nuvens
var colecaoFiltrada = colecaoAgosto
  .filter(ee.Filter.lt('CLOUD_COVER', 10))
  .map(processarLST);
  
//SELECIONAR ESSA IMAGEM
var imagemEscolhida = colecaoFiltrada.sort('CLOUD_COVER').first();
var lstGoiania = imagemEscolhida.select('LST_C').clip(goiania);

print("Data da Imagem:", imagemEscolhida.date().format('YYYY-MM-dd'));
print("Percentual de Nuvens da Cena Escolhida (%):",
imagemEscolhida.get('CLOUD_COVER'));

//Ve o mapa
var lstVis = 
{
  min: 22.0,
  max: 42.0,
  palette: ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'darkred']
};
  
Map.addLayer(lstGoiania, lstVis, 'LST (°C) - Goiânia ' + ano);

//exportar para o drive
Export.image.toDrive({
  image: lstGoiania,
  description: 'Goiania_LST_Agosto_' + ano,
  scale: 30,
  region: goiania,
  fileFormat: 'GeoTIFF'
});