import Image from "next/image";

export default function Logo({ dark = false }: { dark?: boolean }){
  // dark = true -> Dashboard sidebar (dark background)
  // dark = false -> Home / Header (white background)
  return (
    <a href="/" style={{display:'inline-flex',alignItems:'center',textDecoration:'none',lineHeight:0}}>
      <Image
        src="/logo.png"
        alt="PicQR.in"
        width={dark ? 150 : 180}
        height={dark ? 44 : 52}
        priority
        style={{
          height:'auto',
          width:'auto',
          maxWidth: dark ? 150 : 180,
          objectFit:'contain',
          // White background image kabatti, dark sidebar lo white pill la chupistham - border la kanipinchadu
          background: dark ? '#fff' : 'transparent',
          borderRadius: dark ? 10 : 0,
          padding: dark ? '6px 10px' : 0,
          display:'block'
        }}
      />
    </a>
  );
}