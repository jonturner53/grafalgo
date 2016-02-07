SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/becolor.h 
OFILES = becolor.o becolor_g.o becolor_msm.o becolor_mdm.o becolor_ap.o \
	 becolor_ss.o becolorlb_d.o becolorlb_m.o becolorlb_f.o \
	 becolor_pmd.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBS}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
