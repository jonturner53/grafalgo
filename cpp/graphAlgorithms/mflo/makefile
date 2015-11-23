SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall 
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h ${IDIR}/Graph_f.h ${IDIR}/Heap_d.h \
	 ${IDIR}/List.h ${IDIR}/mflo_ff.h ${IDIR}/mflo_ffsp.h \
	 ${IDIR}/mflo_ffmc.h ${IDIR}/mflo_ffs.h ${IDIR}/mflo_pp.h \
	 ${IDIR}/mflo_ppf.h ${IDIR}/mflo_pphl.h 

OFILES = mflo_ff.o mflo_ffsp.o mflo_ffmc.o mflo_ffs.o \
	mflo_d.o mflo_dDjsets_lct.o mflo_pp.o mflo_ppf.o mflo_pphl.o mflof.cpp.o

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${LIBGA}

${LIBGA}: ${OFILES}
	ar -ru ${LIBGA} ${OFILES}

clean:
	rm -f *.o ${XFILES}
