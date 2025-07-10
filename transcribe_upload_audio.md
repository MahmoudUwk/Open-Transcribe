myfile = client.files.upload(file='path/to/sample.mp3')
prompt = 'Generate a transcript of the speech.'

response = client.models.generate_content(
  model='gemini-2.5-flash',
  contents=[prompt, myfile]
)

print(response.text)
